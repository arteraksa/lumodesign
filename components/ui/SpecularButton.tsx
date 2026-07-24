"use client";

import { Color, Mesh, Program, Renderer, Triangle } from "ogl";
import { useEffect, useRef, type CSSProperties, type MouseEventHandler, type ReactNode } from "react";
import "./SpecularButton.css";

const vertex = `#version 300 es
in vec2 position; void main(){gl_Position=vec4(position,0.,1.);}`;
const fragment = `#version 300 es
precision highp float; uniform vec2 uCenter,uHalfSize; uniform float uRadius,uAngle,uPx,uIntensity,uShineSize,uShineFade,uThickness,uBaseWidth; uniform vec3 uLineColor,uBaseColor; out vec4 fragColor;
float sd(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
void main(){vec2 p=gl_FragCoord.xy-uCenter;float d=sd(p,uHalfSize,uRadius);vec2 l=vec2(cos(uAngle),sin(uAngle));float base=(1.-smoothstep(0.,uBaseWidth,abs(d)))*.45;vec2 n=normalize(p/(uHalfSize*uHalfSize)+1e-6);float phi=acos(clamp(abs(dot(n,l)),0.,1.));float rim=1.-smoothstep(uShineSize-uShineFade,uShineSize+uShineFade+1e-4,phi);float x=d/(uThickness+1e-6);float line=exp(-mix(1.,1.6,smoothstep(0.,1.5,abs(x)))*x*x);float edge=1.-smoothstep(.5*uPx,3.*uPx,abs(d));float hi=line*rim*edge*uIntensity;fragColor=vec4(uBaseColor*base+uLineColor*hi,clamp(base+hi,0.,1.));}`;

type Props = { children: ReactNode; size?: "lg"; radius?: number; tint?: string; tintOpacity?: number; blur?: number; textColor?: string; lineColor?: string; baseColor?: string; intensity?: number; shineSize?: number; shineFade?: number; thickness?: number; speed?: number; autoAnimate?: boolean; className?: string; href?: string; onClick?: MouseEventHandler<HTMLButtonElement> };

const hex = (value: string) => { const c = new Color(value); return [c.r, c.g, c.b]; };

export function SpecularButton({ children, size = "lg", radius = 60, tint = "#5a3cff", tintOpacity = .4, blur = 0, textColor = "#f5f5f5", lineColor = "#ebefff", baseColor = "#2f208f", intensity = 1, shineSize = 5, shineFade = 40, thickness = 1, speed = 1.5, autoAnimate = true, className = "", href, onClick }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null); const fxRef = useRef<HTMLSpanElement>(null);
  useEffect(() => { const button=buttonRef.current, fx=fxRef.current; if(!button||!fx)return; const renderer=new Renderer({alpha:true,premultipliedAlpha:true,antialias:true,dpr:Math.min(devicePixelRatio||1,2)}); const gl=renderer.gl; gl.clearColor(0,0,0,0); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA); const program=new Program(gl,{vertex,fragment,uniforms:{uCenter:{value:[0,0]},uHalfSize:{value:[1,1]},uRadius:{value:0},uAngle:{value:2.4},uPx:{value:devicePixelRatio||1},uLineColor:{value:hex(lineColor)},uBaseColor:{value:hex(baseColor)},uIntensity:{value:0},uShineSize:{value:shineSize*Math.PI/180},uShineFade:{value:shineFade*Math.PI/180},uThickness:{value:thickness*(devicePixelRatio||1)},uBaseWidth:{value:devicePixelRatio||1}}}); const mesh=new Mesh(gl,{geometry:new Triangle(gl),program}); fx.appendChild(gl.canvas); const resize=()=>{const r=button.getBoundingClientRect(),d=devicePixelRatio||1;renderer.setSize(r.width+40,r.height+40);program.uniforms.uCenter.value=[(20+r.width/2)*d,(20+r.height/2)*d];program.uniforms.uHalfSize.value=[r.width/2*d,r.height/2*d];program.uniforms.uRadius.value=Math.min(radius,Math.min(r.width,r.height)/2)*d;}; const ro=new ResizeObserver(resize);ro.observe(button);resize();let raf=0,last=performance.now(),angle=2.4;const loop=(now:number)=>{const dt=Math.min((now-last)/1000,.05);last=now;angle+=speed*dt;program.uniforms.uAngle.value=angle;program.uniforms.uIntensity.value=autoAnimate?intensity:0;renderer.render({scene:mesh});raf=requestAnimationFrame(loop);};raf=requestAnimationFrame(loop);return()=>{cancelAnimationFrame(raf);ro.disconnect();gl.getExtension("WEBGL_lose_context")?.loseContext();fx.replaceChildren();};},[autoAnimate,baseColor,intensity,lineColor,radius,shineFade,shineSize,speed,thickness]);
  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => { onClick?.(event); if (href) window.open(href, "_blank", "noopener,noreferrer"); };
  return <button ref={buttonRef} type="button" onClick={handleClick} className={`specular-button specular-button--${size} ${className}`.trim()} style={{ "--sb-radius": `${radius}px`, "--sb-tint": tint, "--sb-tint-opacity": tintOpacity, "--sb-blur": `${blur}px`, "--sb-text-color": textColor } as CSSProperties}><span ref={fxRef} className="specular-button__fx" aria-hidden="true" /><span className="specular-button__label">{children}</span></button>;
}
