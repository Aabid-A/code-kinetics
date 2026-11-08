import { Bell, Calendar, CircleCheck, Clock, Cloud, Code, Download, Gift, Heart, Layers, Lock, Mail, Rocket,
  Search, Settings, Shield, Sparkles, Star, User, Zap, type LucideIcon } from "lucide-react";
import { createElement } from "react";
import type { IconName } from "@/lib/lab/generated";

const icons: Record<IconName, LucideIcon> = {
  Sparkles, Zap, Bell, CircleCheck, Layers, Star, Heart, Rocket, Shield, Lock,
  Mail, Calendar, Clock, Download, Settings, User, Cloud, Search, Code, Gift,
};

export function NamedIcon({ name, size, strokeWidth }: { name: string; size: number; strokeWidth: number }) {
  const icon = (icons as Record<string, LucideIcon | undefined>)[name] ?? Layers;
  return createElement(icon, { size, strokeWidth });
}
