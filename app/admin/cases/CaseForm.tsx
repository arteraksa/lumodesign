"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, CheckCircle2, GripVertical, ImagePlus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { removeUploadedProjectImage, uploadProjectImage } from "@/lib/portfolio/client-media-upload";
import { normalizeCaseSlug } from "@/lib/portfolio/slug";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { documentFromStoredContent, serializeRichTextDocument } from "@/lib/content/rich-text";
import type { PortfolioCase, PortfolioCaseMedia } from "@/lib/supabase/database.types";
import { caseClientSchema, type CaseClientInput } from "@/lib/validation/case";

type EditableMedia = PortfolioCaseMedia & { preview_url: string };
type SubmissionIntent = "draft" | "published";
type SaveResult = { caseId: string; notice: "saved" | "published" };
type UploadState = "queued" | "uploading" | "success" | "ready" | "error";

type ProjectImage = {
  id: string;
  source: "existing" | "uploaded";
  previewUrl: string;
  filename: string;
  mediaId?: string;
  path?: string;
  fileKey?: string;
  altText: string;
  caption: string;
  state: UploadState;
  progress: number;
  error?: string;
};

type CoverImage = {
  source: "existing" | "uploaded";
  previewUrl: string;
  filename: string;
  path?: string;
  state: UploadState;
  progress: number;
};

function datetimeLocalValue(value?: string | null) {
  return value ? value.slice(0, 16) : "";
}

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function FieldError({ message }: { message?: string }) {
  return message ? <small className="field-error" role="alert">{message}</small> : null;
}

function initialProjectImages(media: EditableMedia[], coverPath?: string | null): ProjectImage[] {
  return [...media]
    .filter((entry) => !coverPath || entry.storage_path !== coverPath)
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((entry) => ({
      id: `saved:${entry.id}`,
      source: "existing",
      mediaId: entry.id,
      previewUrl: entry.preview_url,
      filename: entry.storage_path?.split("/").at(-1) || entry.alt_text || "Imagem do projeto",
      altText: entry.alt_text,
      caption: entry.caption,
      state: "ready",
      progress: 100,
    }));
}

export function CaseForm({ item, media = [], coverPreviewUrl = "", categoryOptions, action, createCategoryAction }: {
  item?: PortfolioCase;
  media?: EditableMedia[];
  coverPreviewUrl?: string;
  categoryOptions: string[];
  action: (data: FormData) => Promise<SaveResult>;
  createCategoryAction: (data: FormData) => Promise<{ name: string; slug: string }>;
}) {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState("");
  const [slugEdited, setSlugEdited] = useState(Boolean(item?.slug));
  const [categoryOptionsState, setCategoryOptionsState] = useState(categoryOptions);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [projectImages, setProjectImages] = useState<ProjectImage[]>(() => initialProjectImages(media, item?.cover_storage_path));
  const [coverImage, setCoverImage] = useState<CoverImage | null>(() => item?.cover_storage_path && coverPreviewUrl ? {
    source: "existing",
    previewUrl: coverPreviewUrl,
    filename: item.cover_storage_path.split("/").at(-1) || "Imagem de capa",
    path: item.cover_storage_path,
    state: "ready",
    progress: 100,
  } : null);
  const [coverError, setCoverError] = useState("");
  const [uploadBatchId] = useState(() => item?.id ?? crypto.randomUUID());
  const [intent, setIntent] = useState<SubmissionIntent>(item?.status === "published" ? "published" : "draft");
  const [operation, setOperation] = useState<{ intent: SubmissionIntent; phase: "loading" | "success" } | null>(null);
  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<CaseClientInput>({
    resolver: zodResolver(caseClientSchema),
    shouldFocusError: false,
    defaultValues: {
      title: item?.title ?? "", slug: item?.slug ?? "", client_name: item?.client_name ?? "",
      categories: item?.categories.join(", ") ?? "", excerpt: item?.excerpt ?? "", content_html: serializeRichTextDocument(documentFromStoredContent(item?.content_html)),
      cover_url: item?.cover_url ?? "", external_url: item?.external_url ?? "", status: item?.status ?? "draft",
      home_order: item?.home_order ?? 999, portfolio_order: item?.portfolio_order ?? 999,
      seo_title: item?.seo_title ?? "", seo_description: item?.seo_description ?? "", published_at: datetimeLocalValue(item?.published_at),
    },
  });
  const title = useWatch({ control, name: "title" });
  const selectedCategoriesValue = useWatch({ control, name: "categories" }) ?? "";
  const excerpt = useWatch({ control, name: "excerpt" }) ?? "";
  const content = useWatch({ control, name: "content_html" }) ?? "";
  const selectedCategories = useMemo(() => selectedCategoriesValue.split(",").map((value) => value.trim()).filter(Boolean), [selectedCategoriesValue]);
  const isUploading = projectImages.some((image) => image.source === "uploaded" && (image.state === "queued" || image.state === "uploading"))
    || Boolean(coverImage && (coverImage.state === "queued" || coverImage.state === "uploading"));
  const hasUploadErrors = projectImages.some((image) => image.source === "uploaded" && image.state === "error");

  useEffect(() => {
    if (!slugEdited) setValue("slug", normalizeCaseSlug(title ?? ""), { shouldDirty: Boolean(title), shouldValidate: true });
  }, [slugEdited, setValue, title]);

  const submit = handleSubmit((_, event) => {
    const form = event?.target;
    if (!(form instanceof HTMLFormElement)) {
      setServerError("Não foi possível preparar o salvamento. Atualize a página e tente novamente.");
      return;
    }
    if (isUploading) {
      setServerError("Aguarde o término do envio das imagens antes de salvar o case.");
      return;
    }
    if (hasUploadErrors) {
      setServerError("Algumas imagens não foram anexadas. Remova-as ou tente enviar novamente antes de salvar.");
      return;
    }
    const submitter = (event?.nativeEvent as SubmitEvent | undefined)?.submitter as HTMLButtonElement | null;
    const nextIntent = submitter?.dataset.intent === "published" ? "published" : "draft";
    if (nextIntent === "published" && !coverImage) {
      setCoverError("Envie uma imagem de capa antes de publicar.");
      setServerError("Revise o campo destacado: envie uma imagem de capa antes de publicar.");
      return;
    }
    const data = new FormData(form);
    data.set("status", nextIntent);
    data.set("seo_title", (title ?? "").slice(0, 70));
    data.set("seo_description", excerpt.slice(0, 170));
    data.set("media_manifest", JSON.stringify(projectImages.map((image) => image.source === "existing"
      ? { source: "existing", id: image.mediaId, altText: image.altText, caption: image.caption }
      : { source: "uploaded", path: image.path, altText: image.altText, caption: image.caption })));
    data.set("cover_manifest", JSON.stringify(coverImage
      ? coverImage.source === "existing" ? { source: "existing" } : { source: "uploaded", path: coverImage.path }
      : { source: "none" }));
    setServerError("");
    setIntent(nextIntent);
    const minimumDelay = new Promise<void>((resolve) => window.setTimeout(resolve, 3000));
    setOperation({ intent: nextIntent, phase: "loading" });
    startTransition(async () => {
      try {
        const result = await action(data);
        await minimumDelay;
        setOperation({ intent: nextIntent, phase: "success" });
        await new Promise<void>((resolve) => window.setTimeout(resolve, 900));
        window.location.assign(`/admin/cases/${result.caseId}/edit?notice=${result.notice}`);
      } catch (cause) {
        await minimumDelay;
        setServerError(cause instanceof Error ? cause.message : "Não foi possível concluir a ação. Tente novamente.");
        setOperation(null);
      }
    });
  }, (formErrors) => {
    const messages = Object.values(formErrors).map((error) => error?.message).filter((message): message is string => Boolean(message));
    setServerError(messages.length ? `Revise os campos marcados: ${messages.join(" ")}` : "Revise os campos marcados antes de continuar.");
  });

  function chooseIntent(nextIntent: SubmissionIntent) {
    setIntent(nextIntent);
    setValue("status", nextIntent, { shouldValidate: false });
    setServerError("");
  }

  function addExistingCategory(name: string) {
    if (!name || selectedCategories.includes(name)) return;
    setValue("categories", [...selectedCategories, name].join(", "), { shouldDirty: true, shouldValidate: true });
  }

  function removeCategory(name: string) {
    setValue("categories", selectedCategories.filter((category) => category !== name).join(", "), { shouldDirty: true, shouldValidate: true });
  }

  async function queueProjectImages(files: FileList | null) {
    const existingKeys = new Set(projectImages.flatMap((image) => image.fileKey ? [image.fileKey] : []));
    const incoming = Array.from(files ?? []).filter((file) => {
      const key = fileKey(file);
      if (existingKeys.has(key)) return false;
      existingKeys.add(key);
      return true;
    });
    if (!incoming.length) return;
    setServerError("");
    const staged = incoming.map((file) => ({
      file,
      image: {
        id: `upload:${crypto.randomUUID()}`,
        source: "uploaded" as const,
        previewUrl: URL.createObjectURL(file),
        filename: file.name,
        fileKey: fileKey(file),
        altText: "",
        caption: "",
        state: "queued" as const,
        progress: 0,
      },
    }));
    setProjectImages((current) => [...current, ...staged.map((entry) => entry.image)]);

    for (const stagedImage of staged) {
      setProjectImages((current) => current.map((image) => image.id === stagedImage.image.id ? { ...image, state: "uploading", progress: 1 } : image));
      try {
        const uploaded = await uploadProjectImage(stagedImage.file, uploadBatchId, (progress) => {
          setProjectImages((current) => current.map((image) => image.id === stagedImage.image.id ? { ...image, progress } : image));
        });
        setProjectImages((current) => current.map((image) => image.id === stagedImage.image.id ? { ...image, path: uploaded.path, state: "success", progress: 100 } : image));
        window.setTimeout(() => setProjectImages((current) => current.map((image) => image.id === stagedImage.image.id && image.state === "success" ? { ...image, state: "ready" } : image)), 3600);
      } catch (cause) {
        setProjectImages((current) => current.map((image) => image.id === stagedImage.image.id ? { ...image, state: "error", error: cause instanceof Error ? cause.message : "Não foi possível enviar esta imagem." } : image));
      }
    }
  }

  async function queueCoverImage(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const previous = coverImage;
    const next: CoverImage = {
      source: "uploaded",
      previewUrl: URL.createObjectURL(file),
      filename: file.name,
      state: "uploading",
      progress: 1,
    };
    setCoverError("");
    setServerError("");
    setCoverImage(next);
    try {
      const uploaded = await uploadProjectImage(file, uploadBatchId, (progress) => {
        setCoverImage((current) => current?.previewUrl === next.previewUrl ? { ...current, progress } : current);
      });
      setCoverImage((current) => current?.previewUrl === next.previewUrl ? { ...current, path: uploaded.path, state: "success", progress: 100 } : current);
      if (previous?.source === "uploaded" && previous.path) {
        await removeUploadedProjectImage(previous.path).catch(() => undefined);
        URL.revokeObjectURL(previous.previewUrl);
      }
      window.setTimeout(() => setCoverImage((current) => current?.previewUrl === next.previewUrl && current.state === "success" ? { ...current, state: "ready" } : current), 3600);
    } catch (cause) {
      URL.revokeObjectURL(next.previewUrl);
      setCoverImage(previous);
      setCoverError(cause instanceof Error ? cause.message : "Não foi possível enviar a imagem de capa.");
    }
  }

  async function removeCoverImage() {
    if (!coverImage || coverImage.state === "uploading" || coverImage.state === "queued") return;
    if (coverImage.source === "uploaded" && coverImage.path) {
      try {
        await removeUploadedProjectImage(coverImage.path);
      } catch (cause) {
        setCoverError(cause instanceof Error ? cause.message : "Não foi possível remover a imagem de capa.");
        return;
      }
      URL.revokeObjectURL(coverImage.previewUrl);
    }
    setCoverImage(null);
    setCoverError("");
  }

  async function removeProjectImage(id: string) {
    const image = projectImages.find((entry) => entry.id === id);
    if (!image || image.state === "uploading" || image.state === "queued") return;
    if (image.source === "uploaded" && image.path) {
      try {
        await removeUploadedProjectImage(image.path);
      } catch (cause) {
        setServerError(cause instanceof Error ? cause.message : "Não foi possível remover esta imagem.");
        return;
      }
    }
    if (image.source === "uploaded") URL.revokeObjectURL(image.previewUrl);
    setProjectImages((current) => current.filter((entry) => entry.id !== id));
  }

  function moveProjectImage(id: string, direction: -1 | 1) {
    setProjectImages((current) => {
      const index = current.findIndex((image) => image.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function updateProjectImage(id: string, updates: Pick<ProjectImage, "altText" | "caption">) {
    setProjectImages((current) => current.map((image) => image.id === id ? { ...image, ...updates } : image));
  }

  function addCategory() {
    const formData = new FormData();
    formData.set("name", categoryName);
    setCategoryError("");
    startTransition(async () => {
      try {
        const category = await createCategoryAction(formData);
        setCategoryOptionsState((current) => [...new Set([...current, category.name])].sort((a, b) => a.localeCompare(b, "pt-BR")));
        addExistingCategory(category.name);
        setCategoryName("");
        setCategoryModalOpen(false);
      } catch (cause) {
        setCategoryError(cause instanceof Error ? cause.message : "Não foi possível cadastrar a categoria.");
      }
    });
  }

  return (
    <form className="case-form" data-testid="case-form" onSubmit={submit} noValidate>
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      {item ? <input type="hidden" name="version" value={item.version} /> : null}
      <input type="hidden" {...register("status")} />
      <input type="hidden" {...register("categories")} />
      <input type="hidden" {...register("cover_url")} />

      <div className="admin-editor-layout">
        <fieldset disabled={pending}>
          <section className="admin-panel admin-panel--identity">
            <div className="admin-panel__heading"><span>01</span><div><h2>Identificação</h2><p>Defina como este case será encontrado e apresentado.</p></div></div>
            <label className={errors.title ? "has-error" : ""}>Título<input data-testid="case-title" aria-invalid={Boolean(errors.title)} {...register("title")} /><FieldError message={errors.title?.message} /></label>
            <div className="admin-form-row admin-form-row--two">
              <label className={errors.slug ? "has-error" : ""}>Slug<input data-testid="case-slug" aria-invalid={Boolean(errors.slug)} {...register("slug", { onChange: () => setSlugEdited(true) })} /><FieldError message={errors.slug?.message} />{!errors.slug ? <small>Gerado automaticamente pelo título. Você pode ajustar se precisar.</small> : null}</label>
              <label className={errors.client_name ? "has-error" : ""}>Cliente<input aria-invalid={Boolean(errors.client_name)} {...register("client_name")} /><FieldError message={errors.client_name?.message} /></label>
            </div>
            <label className={errors.categories ? "has-error" : ""}>Categorias
              <div className="admin-category-control"><select aria-label="Adicionar categoria" defaultValue="" onChange={(event) => { addExistingCategory(event.target.value); event.currentTarget.value = ""; }}><option value="" disabled>Selecione uma categoria</option>{categoryOptionsState.filter((category) => !selectedCategories.includes(category)).map((category) => <option value={category} key={category}>{category}</option>)}</select><button className="admin-text-action" type="button" onClick={() => setCategoryModalOpen(true)}><Plus size={15} /> Nova</button></div>
              <div className="admin-category-tags" aria-live="polite">{selectedCategories.length ? selectedCategories.map((category) => <span key={category}>{category}<button type="button" aria-label={`Remover ${category}`} onClick={() => removeCategory(category)}>×</button></span>) : <small>Nenhuma categoria selecionada.</small>}</div>
              <FieldError message={errors.categories?.message} />
            </label>
            <label className={errors.excerpt ? "has-error" : ""}>Descrição curta<textarea rows={3} aria-invalid={Boolean(errors.excerpt)} {...register("excerpt")} /><span className="field-counter">{excerpt.length}/320 caracteres</span><FieldError message={errors.excerpt?.message} /></label>
          </section>

          <section className="admin-panel">
            <div className="admin-panel__heading"><span>02</span><div><h2>Conteúdo</h2><p>Conte a história do projeto em blocos de texto.</p></div></div>
            <label>Descrição do case</label>
            <input type="hidden" {...register("content_html")} />
            <RichTextEditor value={content} invalid={Boolean(errors.content_html)} onChange={(nextValue) => setValue("content_html", nextValue, { shouldDirty: true, shouldValidate: true })} />
            <small id="case-content-help">Use a barra de formatação para destacar trechos e criar listas. Enter inicia um novo parágrafo.</small>
            <FieldError message={errors.content_html?.message} />
          </section>

          <section className="admin-panel">
            <div className="admin-panel__heading"><span>03</span><div><h2>Imagem de capa</h2><p>Esta imagem representa o case nas listagens, nos cards e no compartilhamento. Ela não aparece no corpo do projeto.</p></div></div>
            <label className={`admin-upload-zone ${coverError ? "has-error" : ""}`}><ImagePlus size={19} /><strong>{coverImage ? "Substituir imagem de capa" : "Adicionar imagem de capa"}</strong><input data-testid="cover-upload" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => { void queueCoverImage(event.target.files); event.currentTarget.value = ""; }} /><span>Escolha uma imagem única em JPEG, PNG, WebP ou AVIF, com até 25 MB.</span></label>
            {coverError ? <p className="field-error" role="alert">{coverError}</p> : null}
            {coverImage ? <div className="admin-cover-image" data-testid="cover-image">
              <Image src={coverImage.previewUrl} alt="Prévia da capa do case" width={320} height={180} unoptimized />
              <div className="admin-cover-image__content"><strong>{coverImage.filename}</strong><span>Usada somente como capa do case</span>
                {coverImage.state === "queued" || coverImage.state === "uploading" ? <div className="admin-upload-progress" role="progressbar" aria-label={`Enviando ${coverImage.filename}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={coverImage.progress}><span style={{ width: `${coverImage.progress}%` }} /><small>{`Enviando para a plataforma · ${coverImage.progress}%`}</small></div> : null}
                {coverImage.state === "success" ? <span className="admin-upload-state admin-upload-state--success"><CheckCircle2 size={15} /> Carregada com sucesso</span> : null}
                {coverImage.state === "ready" ? <span className="admin-upload-state">Anexada como capa</span> : null}
              </div>
              <button className="admin-remove-media" type="button" disabled={coverImage.state === "queued" || coverImage.state === "uploading"} onClick={() => { void removeCoverImage(); }}><Trash2 size={16} /> Excluir</button>
            </div> : <p className="admin-empty admin-empty--compact">Nenhuma capa anexada. Você ainda pode salvar este case como rascunho.</p>}
          </section>

          <section className="admin-panel">
            <div className="admin-panel__heading"><span>04</span><div><h2>Imagens do projeto</h2><p>Envie as imagens que aparecerão no corpo do case e organize a ordem de exibição.</p></div></div>
            <label className="admin-upload-zone"><ImagePlus size={19} /><strong>Adicionar imagens</strong><input data-testid="gallery-upload" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={(event) => { void queueProjectImages(event.target.files); event.currentTarget.value = ""; }} /><span>JPEG, PNG, WebP ou AVIF de até 25 MB por imagem. Você pode adicionar arquivos quantas vezes precisar.</span></label>
            <p className="admin-project-images-help">Estas imagens pertencem somente ao conteúdo do projeto. Use os controles à esquerda para definir a ordem de exibição.</p>
            {projectImages.length ? <ol className="admin-project-images" aria-label="Imagens do projeto">{projectImages.map((image, index) => <li key={image.id} className={image.state === "error" ? "is-error" : ""} data-testid="project-image">
              <div className="admin-image-position"><GripVertical aria-hidden="true" size={18} /><strong>{index + 1}</strong><div><button type="button" aria-label={`Mover ${image.filename} para cima`} disabled={index === 0} onClick={() => moveProjectImage(image.id, -1)}><ArrowUp size={15} /></button><button type="button" aria-label={`Mover ${image.filename} para baixo`} disabled={index === projectImages.length - 1} onClick={() => moveProjectImage(image.id, 1)}><ArrowDown size={15} /></button></div></div>
              <Image src={image.previewUrl} alt={image.altText || image.filename} width={176} height={132} unoptimized />
              <div className="admin-project-image__content"><div className="admin-project-image__meta"><div><strong>{image.filename}</strong><span>{`Imagem ${index + 1} do corpo do case`}</span></div>{image.state === "success" ? <span className="admin-upload-state admin-upload-state--success"><CheckCircle2 size={15} /> Carregada com sucesso</span> : null}{image.state === "ready" ? <span className="admin-upload-state">Anexada ao projeto</span> : null}</div>
                {image.state === "queued" || image.state === "uploading" ? <div className="admin-upload-progress" role="progressbar" aria-label={`Enviando ${image.filename}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={image.progress}><span style={{ width: `${image.progress}%` }} /><small>{image.state === "queued" ? "Aguardando envio" : `Enviando para a plataforma · ${image.progress}%`}</small></div> : null}
                {image.state === "error" ? <p className="field-error" role="alert">{image.error}</p> : null}
                <div className="admin-project-image__fields"><label>Texto alternativo<input value={image.altText} onChange={(event) => updateProjectImage(image.id, { altText: event.target.value, caption: image.caption })} placeholder="Descreva a imagem" /></label><label>Legenda (opcional)<input value={image.caption} onChange={(event) => updateProjectImage(image.id, { altText: image.altText, caption: event.target.value })} /></label></div>
              </div>
              <button className="admin-remove-media" type="button" disabled={image.state === "queued" || image.state === "uploading"} onClick={() => { void removeProjectImage(image.id); }}><Trash2 size={16} /> Excluir</button>
            </li>)}</ol> : <p className="admin-empty admin-empty--compact">Nenhuma imagem no corpo do case. Você pode adicionar imagens agora ou continuar o rascunho depois.</p>}
          </section>
        </fieldset>

        <aside className="admin-action-rail" aria-label="Ações do case">
          <div><span>Status atual</span><strong className={`admin-status-pill admin-status-pill--${item?.status ?? "draft"}`}>{item?.status === "published" ? "Publicado" : item?.status === "archived" ? "Arquivado" : "Rascunho"}</strong></div>
          <p>{isUploading ? "As imagens estão sendo enviadas. Você poderá salvar quando todas estiverem anexadas." : "Salve como rascunho para continuar depois ou publique quando o case estiver pronto."}</p>
          {serverError ? <p className="admin-error" role="alert" data-testid="case-form-error">{serverError}</p> : null}
          <button className="button button--primary" data-testid="publish-case" data-intent="published" type="submit" disabled={pending || isUploading} onClick={() => chooseIntent("published")}>{pending && intent === "published" ? "Publicando…" : item?.status === "published" ? "Atualizar publicação" : "Publicar case"}</button>
          <button className="button button--secondary" data-testid="save-case" data-intent="draft" type="submit" disabled={pending || isUploading} onClick={() => chooseIntent("draft")}>{pending && intent === "draft" ? "Salvando…" : "Salvar rascunho"}</button>
          <a href="/admin/cases">Cancelar e voltar à lista</a>
        </aside>
      </div>

      {categoryModalOpen ? <div className="admin-modal-backdrop" role="presentation"><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="new-category-title"><h2 id="new-category-title">Nova categoria</h2><p>Ela ficará disponível no editor e nos filtros públicos de cases.</p><label>Nome da categoria<input autoFocus value={categoryName} onChange={(event) => setCategoryName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCategory(); } }} /></label>{categoryError ? <p className="admin-error" role="alert">{categoryError}</p> : null}<div><button className="button button--secondary" type="button" onClick={() => setCategoryModalOpen(false)}>Cancelar</button><button className="button button--primary" type="button" disabled={pending || !categoryName.trim()} onClick={addCategory}>{pending ? "Cadastrando…" : "Cadastrar categoria"}</button></div></section></div> : null}
      {operation ? <div className="admin-operation-backdrop" role="presentation"><section className="admin-operation-modal" role="dialog" aria-live="assertive" aria-modal="true" aria-labelledby="operation-title">{operation.phase === "loading" ? <><span className="admin-operation-spinner" aria-hidden="true" /><h2 id="operation-title">{operation.intent === "published" ? "Publicando seu case" : "Salvando seu rascunho"}</h2><p>{operation.intent === "published" ? "Estamos preparando a publicação das suas imagens. Isso pode levar alguns segundos." : "Estamos guardando as informações e a ordem das suas imagens. Isso pode levar alguns segundos."}</p></> : <><span className="admin-operation-success" aria-hidden="true">✓</span><h2 id="operation-title">{operation.intent === "published" ? "Case publicado com sucesso" : "Rascunho salvo com sucesso"}</h2><p>Pronto. Vamos atualizar a página para mostrar o resultado.</p></>}</section></div> : null}
    </form>
  );
}
