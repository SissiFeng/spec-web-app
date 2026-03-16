import {
  Battery, FlaskConical, Sun, Microscope, Cpu, Atom,
  Beaker, Zap, Leaf, Thermometer, Waves, Dna,
} from "lucide-react";

export const ICON_MAP = {
  Battery,
  Flask: FlaskConical,
  FlaskConical,
  Sun,
  Microscope,
  Cpu,
  Atom,
  Beaker,
  Zap,
  Leaf,
  Thermometer,
  Waves,
  Dna,
};

export const resolveIcon = (name) => ICON_MAP[name] || FlaskConical;
