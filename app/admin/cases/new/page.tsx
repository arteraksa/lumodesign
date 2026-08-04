import { requireAdmin } from "@/lib/auth/permissions";
import { CaseForm } from "../CaseForm";
import { createCategoryAction, saveCaseAction } from "../actions";
import { getPortfolioCategories } from "@/lib/queries/portfolio-categories";

export default async function NewCasePage() {
  await requireAdmin();
  const categories = await getPortfolioCategories();
  return <main className="admin-page admin-editor"><header><h1>Novo case</h1></header><CaseForm categoryOptions={categories} action={saveCaseAction} createCategoryAction={createCategoryAction} /></main>;
}
