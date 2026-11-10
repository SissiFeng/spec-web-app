import {
  Cloud, Server, Building2, ShoppingCart, Landmark, Factory,
  HeartPulse, GraduationCap, Truck, Plane, Zap, Database,
  FlaskConical,
} from "lucide-react";

// Engagement icons, roughly by customer industry.
export const ICON_MAP = {
  Cloud,
  Server,
  Building2,
  ShoppingCart,
  Landmark,
  Factory,
  HeartPulse,
  GraduationCap,
  Truck,
  Plane,
  Zap,
  Database,
  // Kept so projects created by earlier versions still resolve
  Flask: FlaskConical,
  FlaskConical,
};

export const ICON_OPTIONS = Object.entries(ICON_MAP)
  .filter(([name]) => !["Flask", "FlaskConical"].includes(name))
  .map(([name, icon]) => ({ name, icon }));

export const resolveIcon = (name) => ICON_MAP[name] || Cloud;
