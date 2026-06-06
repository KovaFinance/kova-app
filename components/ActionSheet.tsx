"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { Icon } from "./kova";

const FAB_ACTIONS = [
  {
    key: "receive",
    href: "/receive",
    icon: "arrowDown",
    title: "Recibir dinero",
    sub: "Obtener tu dirección Stellar",
  },
  {
    key: "send",
    href: "/send",
    icon: "arrowUp",
    title: "Enviar dinero",
    sub: "Envía a cualquier dirección Stellar",
  },
  {
    key: "deposit",
    href: "/deposit",
    icon: "plus",
    title: "Aportar manualmente",
    sub: "Añade a tu fondo de retiro",
  },
];

export function ActionSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const root = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open || !root.current) return;
    const gctx = gsap.context(() => {
      const q = gsap.utils.selector(root);
      gsap
        .timeline()
        .from(q(".fab-sheet"), { y: 20, opacity: 0, duration: 0.35, ease: "power2.out" })
        .from(
          q(".fab-row"),
          { x: -12, opacity: 0, duration: 0.3, stagger: 0.06, ease: "power2.out" },
          "-=0.2"
        )
        .from(
          q(".fab-close"),
          { scale: 0.7, opacity: 0, duration: 0.25, ease: "back.out(1.8)" },
          "-=0.1"
        );
    }, root);
    return () => gctx.revert();
  }, [open]);

  if (!open) return null;

  const select = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div ref={root} className="fab-overlay" onClick={onClose}>
      <div className="fab-sheet" onClick={(e) => e.stopPropagation()}>
        {FAB_ACTIONS.map((a) => (
          <button key={a.key} className="fab-row" onClick={() => select(a.href)}>
            <span className="fab-row-ico">
              <Icon name={a.icon} size={22} sw={2} />
            </span>
            <span className="fab-row-text">
              <span className="fab-row-title">{a.title}</span>
              <span className="fab-row-sub">{a.sub}</span>
            </span>
          </button>
        ))}
      </div>
      <button className="fab-close" onClick={onClose} aria-label="Cerrar">
        <Icon name="close" size={22} sw={2.2} />
      </button>
    </div>
  );
}

export default ActionSheet;
