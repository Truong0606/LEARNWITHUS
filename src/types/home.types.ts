import type { LucideIcon } from 'lucide-react';

export interface Testimonial {
  content: string;
  name: string;
  location: string;
  rating: number;
}

export interface TeamMember {
  name: string;
  title: string;
  image: string;
}

export interface BlogPost {
  title: string;
  description: string;
  link: string;
  icon?: LucideIcon;
  color?: string;
}

export interface FAQ {
  question: string;
  answer: string;
  key: string;
}

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  color?: string;
}

export interface ProcessStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface TrustIndicator {
  value: string;
  label: string;
}
