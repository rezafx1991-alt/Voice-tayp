import { useState, ReactNode } from 'react';

interface KeyProps {
  label: ReactNode;
  onPress: () => void;
  width?: number;
  active?: boolean;
  variant?: 'default' | 'modifier' | 'accent' | 'danger';
  className?: string;
}

const VARIANT_CLASSES: Record<NonNullable<KeyProps['variant']>, string> = {
  default: 'bg-white/5 hover:bg-white/10 text-white/90',
  modifier: 'bg-white/[0.03] hover:bg-white/10 text-white/60',
  accent: 'bg-accent/20 hover:bg-accent/30 text-accent',
  danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-300',
};

export default function Key({ label, onPress, width = 1, active = false, variant = 'default', className = '' }: KeyProps) {
  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    setPressed(true);
    onPress();
    setTimeout(() => setPressed(false), 100);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{ flexGrow: width, flexBasis: 0 }}
      className={`no-drag flex h-10 select-none items-center justify-center rounded-lg text-sm font-medium transition-colors duration-75 active:scale-95 ${
        VARIANT_CLASSES[variant]
      } ${active ? 'ring-2 ring-accent/70' : ''} ${pressed ? 'key-press-anim' : ''} ${className}`}
    >
      {label}
    </button>
  );
}
