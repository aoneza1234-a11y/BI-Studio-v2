import React from 'react';
import { WidgetConfig } from '../../types';
import {
  Sparkles,
  Trophy,
  Lightbulb,
  Bell,
  Megaphone,
  Star,
  Target,
  Info,
  Bookmark,
  FileText,
  AlertCircle,
  Quote,
} from 'lucide-react';

interface TextWidgetProps {
  config: WidgetConfig;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  trophy: Trophy,
  lightbulb: Lightbulb,
  bell: Bell,
  megaphone: Megaphone,
  star: Star,
  target: Target,
  info: Info,
  bookmark: Bookmark,
  fileText: FileText,
  alert: AlertCircle,
  quote: Quote,
};

export const TextWidget: React.FC<TextWidgetProps> = ({ config }) => {
  const IconComponent = ICON_MAP[config.iconName || 'sparkles'] || Sparkles;

  const textAlign = config.textAlign || 'left';
  const alignClass =
    textAlign === 'center'
      ? 'text-center items-center justify-center'
      : textAlign === 'right'
      ? 'text-right items-end justify-end'
      : 'text-left items-start justify-start';

  const style = config.calloutStyle || 'card';

  // Card background preset styles
  let cardBgClass = 'bg-gradient-to-br from-slate-50 to-blue-50/30 text-slate-800';
  let badgeDefaultBg = '#3b82f6';

  if (style === 'gradient') {
    cardBgClass = 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-sm';
    badgeDefaultBg = '#ffffff25';
  } else if (style === 'banner') {
    cardBgClass = 'bg-amber-500/10 border-l-4 border-l-amber-500 text-slate-800';
    badgeDefaultBg = '#f59e0b';
  } else if (style === 'minimal') {
    cardBgClass = 'bg-white text-slate-800';
    badgeDefaultBg = '#64748b';
  } else if (style === 'quote') {
    cardBgClass = 'bg-violet-50/50 border-l-4 border-l-violet-500 text-slate-800';
    badgeDefaultBg = '#8b5cf6';
  }

  const customStyle: React.CSSProperties = {
    fontFamily: config.fontFamily || undefined,
    backgroundColor: config.backgroundColor || undefined,
    color: config.textColor || undefined,
    borderColor: config.borderColor || undefined,
  };

  const badgeBg = config.badgeColor || badgeDefaultBg;

  return (
    <div
      className={`w-full h-full flex flex-col justify-center rounded-xl p-5 relative overflow-hidden transition-all ${cardBgClass}`}
      style={customStyle}
    >
      {/* Background glow or accent shape */}
      {style === 'gradient' && (
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      )}

      {/* Top Header Row with Badge & Icon */}
      <div className={`flex items-center gap-2 mb-2 w-full ${alignClass}`}>
        {config.badgeText && (
          <span
            className="px-2.5 py-0.5 text-[11px] font-bold rounded-full uppercase tracking-wider text-white shadow-2xs"
            style={{ backgroundColor: badgeBg }}
          >
            {config.badgeText}
          </span>
        )}
        <span
          className={`p-1.5 rounded-lg shrink-0 ${
            style === 'gradient'
              ? 'bg-white/20 text-white'
              : 'bg-blue-100 text-blue-600'
          }`}
        >
          <IconComponent className="w-4 h-4" />
        </span>
      </div>

      {/* Title */}
      {config.title && (
        <h2
          className={`font-bold tracking-tight mb-1 w-full ${
            style === 'gradient' ? 'text-white' : 'text-slate-900'
          }`}
          style={{
            fontSize: config.titleFontSize ? `${config.titleFontSize}px` : '18px',
            textAlign: config.textAlign || 'left',
          }}
        >
          {config.title}
        </h2>
      )}

      {/* Subtitle */}
      {config.textSubtitle && (
        <p
          className={`text-xs font-medium mb-2 w-full ${
            style === 'gradient' ? 'text-blue-100' : 'text-slate-500'
          }`}
          style={{ textAlign: config.textAlign || 'left' }}
        >
          {config.textSubtitle}
        </p>
      )}

      {/* Body content */}
      {config.textContent ? (
        <div
          className={`text-sm leading-relaxed whitespace-pre-line w-full ${
            style === 'gradient' ? 'text-blue-50' : 'text-slate-700'
          }`}
          style={{
            fontSize: config.valueFontSize ? `${config.valueFontSize}px` : undefined,
            textAlign: config.textAlign || 'left',
          }}
        >
          {config.textContent}
        </div>
      ) : (
        <p
          className={`text-xs italic ${
            style === 'gradient' ? 'text-blue-200' : 'text-slate-400'
          }`}
        >
          คลิกปรับแต่งเพื่อเพิ่มข้อความและคำอธิบายสำหรับแดชบอร์ดของคุณ
        </p>
      )}
    </div>
  );
};
