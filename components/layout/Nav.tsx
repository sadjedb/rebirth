"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { brand } from "@/config/brand";
import { useCart } from "@/lib/cart-context";
import { useUser } from "@/lib/user-context";

const links = [
  { label: "Collection", href: "/collection" },
  { label: "Journal", href: "/#philosophy" },
  { label: "About", href: "/#about" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { itemCount, openDrawer } = useCart();
  const { user } = useUser();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-500 ${
        scrolled ? "bg-washi/90 backdrop-blur-md border-b border-stone/15" : "bg-transparent"
      }`}
    >
      <div
        className={`mx-auto max-w-[1440px] px-6 md:px-10 flex items-center justify-between transition-all duration-500 ${
          scrolled ? "h-16" : "h-20 md:h-24"
        }`}
      >
        <Link
          href="/"
          className={`font-display italic text-2xl md:text-3xl tracking-tight transition-colors duration-500 ${
            scrolled ? "text-sumi" : "text-washi"
          }`}
        >
          {brand.name}
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[13px] uppercase tracking-[0.14em] font-medium transition-colors duration-500 hover:opacity-60 ${
                scrolled ? "text-sumi" : "text-washi"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href={user ? "/account" : "/login"}
            aria-label={user ? `Account, logged in as ${user.firstName}` : "Log in"}
            className={`transition-colors duration-500 hover:opacity-60 ${
              scrolled ? "text-sumi" : "text-washi"
            }`}
          >
            <UserIcon className="w-5 h-5" />
          </Link>

          <button
            type="button"
            onClick={openDrawer}
            aria-label={`Open bag${itemCount > 0 ? `, ${itemCount} items` : ""}`}
            className={`relative flex items-center transition-colors duration-500 hover:opacity-60 ${
              scrolled ? "text-sumi" : "text-washi"
            }`}
          >
            <BagIcon className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-shu text-washi text-[10px] font-mono leading-none">
                {itemCount}
              </span>
            )}
          </button>

          <Link
            href="/collection"
            className={`text-[13px] uppercase tracking-[0.14em] font-medium border px-5 py-2.5 transition-colors duration-500 ${
              scrolled
                ? "border-sumi text-sumi hover:bg-sumi hover:text-washi"
                : "border-washi text-washi hover:bg-washi hover:text-kachi"
            }`}
          >
            Shop
          </Link>
        </nav>

        <div className="md:hidden flex items-center gap-5">
          <Link
            href={user ? "/account" : "/login"}
            aria-label={user ? `Account, logged in as ${user.firstName}` : "Log in"}
            className={`transition-colors duration-500 ${scrolled ? "text-sumi" : "text-washi"}`}
          >
            <UserIcon className="w-5 h-5" />
          </Link>

          <button
            type="button"
            onClick={openDrawer}
            aria-label={`Open bag${itemCount > 0 ? `, ${itemCount} items` : ""}`}
            className={`relative transition-colors duration-500 ${
              scrolled ? "text-sumi" : "text-washi"
            }`}
          >
            <BagIcon className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-shu text-washi text-[10px] font-mono leading-none">
                {itemCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle menu"
            className={`flex flex-col gap-1.5 w-7 transition-colors duration-500 ${
              scrolled ? "text-sumi" : "text-washi"
            }`}
          >
            <span
              className={`h-px w-full bg-current transition-transform duration-300 ${
                open ? "translate-y-[3.5px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-px w-full bg-current transition-transform duration-300 ${
                open ? "-translate-y-[3.5px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden bg-washi border-t border-stone/15 px-6 py-8 flex flex-col gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-sumi text-sm uppercase tracking-[0.14em] font-medium"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={user ? "/account" : "/login"}
            onClick={() => setOpen(false)}
            className="text-sumi text-sm uppercase tracking-[0.14em] font-medium"
          >
            {user ? "Account" : "Log in"}
          </Link>
          <Link
            href="/collection"
            onClick={() => setOpen(false)}
            className="text-sumi text-sm uppercase tracking-[0.14em] font-medium border border-sumi px-5 py-3 text-center"
          >
            Shop
          </Link>
        </nav>
      )}
    </header>
  );
}

function BagIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden="true">
      <path d="M6 8h12l-1 13H7L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function UserIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" />
    </svg>
  );
}
