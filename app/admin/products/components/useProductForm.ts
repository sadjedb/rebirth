"use client";

import { useReducer } from "react";
import { slugify } from "@/lib/slugify";
import type { FormMediaItem, OrganizationRefValue, ProductFormState } from "@/app/admin/products/types";

export const emptyProductForm: ProductFormState = {
  name: "",
  slug: "",
  slugManuallyEdited: false,
  code: "",
  shortDescription: "",
  description: "",
  details: [],
  status: "DRAFT",
  updatedAt: "",

  price: "",
  compareAtPrice: "",
  costPrice: "",

  sku: "",
  stock: "0",
  lowStockThreshold: "",
  trackInventory: true,
  continueSellingOutOfStock: false,
  sizes: [],

  category: null,
  collections: [],
  tags: [],

  media: [],

  metaTitle: "",
  metaDescription: "",
};

export type ProductFormAction =
  | { type: "SET"; field: keyof ProductFormState; value: ProductFormState[keyof ProductFormState] }
  | { type: "SET_NAME"; value: string }
  | { type: "SET_SLUG"; value: string }
  | { type: "ADD_MEDIA"; media: FormMediaItem }
  | { type: "REMOVE_MEDIA"; id: string }
  | { type: "UPDATE_MEDIA_ALT"; id: string; altText: string }
  | { type: "MOVE_MEDIA"; id: string; direction: "left" | "right" }
  | { type: "SET_FEATURED_MEDIA"; id: string }
  | { type: "SET_CATEGORY"; value: OrganizationRefValue | null }
  | { type: "SET_COLLECTIONS"; value: OrganizationRefValue[] }
  | { type: "SET_TAGS"; value: OrganizationRefValue[] }
  | { type: "SET_DETAILS"; value: string[] }
  | { type: "SET_SIZES"; value: string[] };

function reducer(state: ProductFormState, action: ProductFormAction): ProductFormState {
  switch (action.type) {
    case "SET":
      return { ...state, [action.field]: action.value };

    case "SET_NAME": {
      // Auto-suggest a slug from the name, but only until the admin edits
      // the slug field themselves — after that, typing the name should
      // never silently overwrite a slug they've deliberately customized.
      const next = { ...state, name: action.value };
      if (!state.slugManuallyEdited) {
        next.slug = slugify(action.value);
      }
      return next;
    }

    case "SET_SLUG":
      return { ...state, slug: action.value, slugManuallyEdited: true };

    case "ADD_MEDIA":
      return { ...state, media: [...state.media, action.media] };

    case "REMOVE_MEDIA":
      return { ...state, media: state.media.filter((m) => m.id !== action.id) };

    case "UPDATE_MEDIA_ALT":
      return {
        ...state,
        media: state.media.map((m) => (m.id === action.id ? { ...m, altText: action.altText } : m)),
      };

    case "MOVE_MEDIA": {
      const index = state.media.findIndex((m) => m.id === action.id);
      if (index === -1) return state;
      const targetIndex = action.direction === "left" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= state.media.length) return state;
      const media = [...state.media];
      [media[index], media[targetIndex]] = [media[targetIndex], media[index]];
      return { ...state, media };
    }

    case "SET_FEATURED_MEDIA": {
      const index = state.media.findIndex((m) => m.id === action.id);
      if (index <= 0) return state;
      const media = [...state.media];
      const [item] = media.splice(index, 1);
      media.unshift(item);
      return { ...state, media };
    }

    case "SET_CATEGORY":
      return { ...state, category: action.value };
    case "SET_COLLECTIONS":
      return { ...state, collections: action.value };
    case "SET_TAGS":
      return { ...state, tags: action.value };
    case "SET_DETAILS":
      return { ...state, details: action.value };
    case "SET_SIZES":
      return { ...state, sizes: action.value };

    default:
      return state;
  }
}

export function useProductForm(initial: ProductFormState = emptyProductForm) {
  return useReducer(reducer, initial);
}
