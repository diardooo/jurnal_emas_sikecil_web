import {
  Activity,
  Apple,
  Brain,
  Hand,
  Heart,
  MessageCircle,
  Sparkle,
} from "lucide-react";
import type { MilestoneDomain } from "./types";

export const domainMeta: Record<
  MilestoneDomain,
  { icon: typeof Brain; color: string; chip: string }
> = {
  "Motorik Kasar": {
    icon: Activity,
    color: "bg-gold-100 text-gold-700",
    chip: "border-gold-200 bg-gold-50 text-gold-700",
  },
  "Motorik Halus": {
    icon: Hand,
    color: "bg-soft-orange-soft text-soft-orange",
    chip: "border-soft-orange/30 bg-soft-orange-soft text-soft-orange",
  },
  Kognitif: {
    icon: Brain,
    color: "bg-navy/10 text-navy",
    chip: "border-navy/20 bg-navy/5 text-navy",
  },
  "Bahasa & Komunikasi": {
    icon: MessageCircle,
    color: "bg-sage-soft text-sage",
    chip: "border-sage/30 bg-sage-soft text-sage",
  },
  "Sosial-Emosional": {
    icon: Heart,
    color: "bg-alert-red-soft text-alert-red",
    chip: "border-alert-red/30 bg-alert-red-soft text-alert-red",
  },
  Sensorik: {
    icon: Sparkle,
    color: "bg-gold-100 text-gold-700",
    chip: "border-gold-200 bg-gold-50 text-gold-700",
  },
  "Nutrisi & Pertumbuhan": {
    icon: Apple,
    color: "bg-sage-soft text-sage",
    chip: "border-sage/30 bg-sage-soft text-sage",
  },
};
