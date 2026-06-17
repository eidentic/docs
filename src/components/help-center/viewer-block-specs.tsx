/**
 * Viewer-only BlockNote block specs for the helpcenter reader.
 * These mirror the editor specs but render read-only output only — no editing UI.
 */
import { createReactBlockSpec } from '@blocknote/react';
import { defaultProps } from '@blocknote/core';

// ─── Callout ─────────────────────────────────────────────────────────────────

// Inline styles so they work regardless of Tailwind purging in the helpcenter build
const CALLOUT_STYLES: Record<string, { border: string; bg: string; darkBorder: string; darkBg: string }> = {
  info:    { border: '#bfdbfe', bg: '#eff6ff', darkBorder: '#1e40af', darkBg: 'rgba(23,37,84,0.4)' },
  warning: { border: '#fde68a', bg: '#fffbeb', darkBorder: '#92400e', darkBg: 'rgba(69,26,3,0.4)' },
  success: { border: '#bbf7d0', bg: '#f0fdf4', darkBorder: '#166534', darkBg: 'rgba(5,46,22,0.4)' },
  error:   { border: '#fecaca', bg: '#fef2f2', darkBorder: '#991b1b', darkBg: 'rgba(69,10,10,0.4)' },
  tips:    { border: '#e9d5ff', bg: '#faf5ff', darkBorder: '#6b21a8', darkBg: 'rgba(46,16,101,0.4)' },
  check:   { border: '#99f6e4', bg: '#f0fdfa', darkBorder: '#115e59', darkBg: 'rgba(4,47,46,0.4)' },
  note:    { border: '#e4e4e7', bg: '#fafafa', darkBorder: '#3f3f46', darkBg: 'rgba(24,24,27,0.4)' },
};
const CALLOUT_ICON_COLORS: Record<string, string> = {
  info: '#3b82f6', warning: '#eab308', success: '#22c55e',
  error: '#ef4444', tips: '#a855f7', check: '#14b8a6', note: '#71717a',
};
const CALLOUT_ICONS: Record<string, string> = {
  info:    'hugeicons:information-circle',
  warning: 'hugeicons:alert-02',
  success: 'hugeicons:checkmark-circle-01',
  error:   'hugeicons:cancel-circle',
  tips:    'hugeicons:idea-01',
  check:   'hugeicons:tick-double-01',
  note:    'hugeicons:note-01',
};

export const calloutBlockSpec = createReactBlockSpec(
  {
    type: 'callout' as const,
    propSchema: { ...defaultProps, calloutType: { default: 'info' as string } },
    content: 'inline',
  },
  {
    render: ({ block, contentRef }) => {
      const type = (block.props.calloutType as string) || 'info';
      const s = CALLOUT_STYLES[type] || CALLOUT_STYLES.info;
      // Use CSS custom property for dark mode detection
      return (
        <div
          className="callout-block"
          data-callout-type={type}
          style={{
            display: 'flex', gap: '0.75rem', padding: '1rem',
            borderRadius: '1rem', border: `1px solid ${s.border}`,
            background: s.bg, margin: '0.5rem 0', width: '100%',
          }}
        >
          <span style={{ flexShrink: 0, marginTop: '0.125rem', color: CALLOUT_ICON_COLORS[type] }}>
            <iconify-icon icon={CALLOUT_ICONS[type] || CALLOUT_ICONS.info} width="18" height="18" />
          </span>
          <div ref={contentRef} style={{ flex: 1, minWidth: 0 }} />
          <style>{`
            .dark .callout-block[data-callout-type="${type}"] {
              border-color: ${s.darkBorder} !important;
              background: ${s.darkBg} !important;
            }
          `}</style>
        </div>
      );
    },
  }
)();

// ─── Card ─────────────────────────────────────────────────────────────────────

export const cardBlockSpec = createReactBlockSpec(
  {
    type: 'card' as const,
    propSchema: {
      ...defaultProps,
      icon:      { default: 'hugeicons:file-01' },
      href:      { default: '' },
      imageUrl:  { default: '' },
      cardTitle: { default: '' },
      cardBody:  { default: '' },
    },
    content: 'none',
  },
  {
    render: ({ block }) => {
      const { icon, href, imageUrl, cardTitle, cardBody } = block.props;
      const inner = (
        <div className="flex flex-col flex-1">
          {imageUrl && <img src={imageUrl} alt="" className="w-full h-36 object-cover rounded-t-2xl" />}
          <div className="p-5 flex flex-col flex-1">
            {icon && (
              <span className="mb-2 block" style={{ color: 'var(--viewer-primary, #3b82f6)' }}>
                <iconify-icon icon={icon} width="24" height="24" />
              </span>
            )}
            {cardTitle && <div className="font-semibold text-base text-foreground mb-1">{cardTitle}</div>}
            {cardBody  && <div className="text-sm text-muted-foreground leading-relaxed">{cardBody}</div>}
            {href && (
              <div className="mt-3 flex items-center gap-1 text-xs opacity-60" style={{ color: 'var(--viewer-primary, #3b82f6)' }}>
                <iconify-icon icon="hugeicons:link-01" width="12" height="12" />
                <span className="truncate max-w-[200px]">{href}</span>
              </div>
            )}
          </div>
        </div>
      );
      const cls = "relative w-full rounded-2xl border border-border bg-transparent backdrop-blur-sm flex flex-col overflow-hidden transition-shadow hover:shadow-md h-full";
      return href
        ? <a href={href} target="_blank" rel="noopener noreferrer" className={cls} data-card="" style={{ borderRadius: '1rem', height: '100%' }}>{inner}</a>
        : <div className={cls} data-card="" style={{ borderRadius: '1rem', height: '100%' }}>{inner}</div>;
    },
  }
)();

// ─── Accordion ───────────────────────────────────────────────────────────────

export const accordionBlockSpec = createReactBlockSpec(
  {
    type: 'accordion' as const,
    propSchema: {
      ...defaultProps,
      accordionTitle: { default: '' },
      accordionBody:  { default: '' },
    },
    content: 'none',
  },
  {
    render: ({ block }) => {
      const { accordionTitle, accordionBody } = block.props;
      const [open, setOpen] = useState(false);
      return (
        <div className="w-full border border-border rounded-2xl overflow-hidden my-2">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-background hover:bg-muted/50 cursor-pointer text-left select-none"
            style={{ outline: 'none', boxShadow: 'none', border: 'none', width: '100%' }}
          >
            <iconify-icon
              icon="hugeicons:arrow-down-01"
              width="16" height="16"
              style={{ color: 'var(--muted-foreground)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
            />
            <span className="font-semibold text-foreground flex-1">{accordionTitle || 'Accordion'}</span>
          </button>
          {open && accordionBody && (
            <div className="px-4 py-3 border-t border-border text-sm text-muted-foreground leading-relaxed">
              {accordionBody}
            </div>
          )}
        </div>
      );
    },
  }
)();

// ─── Step ─────────────────────────────────────────────────────────────────────

export const stepsBlockSpec = createReactBlockSpec(
  {
    type: 'step' as const,
    propSchema: {
      ...defaultProps,
      stepTitle:  { default: '' },
      stepNumber: { default: 1 },
    },
    content: 'inline',
  },
  {
    render: ({ block, contentRef }) => {
      const num   = block.props.stepNumber ?? 1;
      const title = block.props.stepTitle ?? '';
      return (
        <div className="flex gap-4 my-4 w-full">
          <div className="flex flex-col items-center flex-shrink-0">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{
                backgroundColor: 'var(--viewer-primary, #ea4e1e)',
                color: '#fff',
                minWidth: '1.75rem',
                minHeight: '1.75rem',
                lineHeight: 1,
              }}
            >
              {num}
            </div>
            <div className="w-px flex-1 bg-border mt-1" />
          </div>
          <div className="flex-1 pb-4 min-w-0">
            {title && <div className="font-semibold text-base text-foreground mb-1">{title}</div>}
            <div ref={contentRef} className="text-muted-foreground text-sm" />
          </div>
        </div>
      );
    },
  }
)();

// ─── Tabs ─────────────────────────────────────────────────────────────────────

import { useState } from 'react';

export const tabsBlockSpec = createReactBlockSpec(
  {
    type: 'tabs' as const,
    propSchema: {
      ...defaultProps,
      tabCount:  { default: 2 },
      tab0label: { default: 'Tab 1' }, tab0body: { default: '' },
      tab1label: { default: 'Tab 2' }, tab1body: { default: '' },
      tab2label: { default: 'Tab 3' }, tab2body: { default: '' },
      tab3label: { default: 'Tab 4' }, tab3body: { default: '' },
    },
    content: 'none',
  },
  {
    render: ({ block }) => {
      const count = Math.max(2, Math.min(4, Number(block.props.tabCount) || 2));
      const [active, setActive] = useState(0);
      const p = block.props as Record<string, string | number>;
      const label = (i: number) => String(p[`tab${i}label`] || `Tab ${i + 1}`);
      const body  = (i: number) => String(p[`tab${i}body`]  || '');
      return (
        <div className="w-full border border-border rounded-2xl overflow-hidden my-2">
          <div className="flex items-center border-b border-border bg-muted/30 overflow-x-auto">
            {Array.from({ length: count }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  active === i
                    ? 'border-[var(--viewer-primary,#3b82f6)] text-foreground bg-background'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {label(i)}
              </button>
            ))}
          </div>
          <div className="p-4 text-sm text-muted-foreground leading-relaxed bg-background">
            {body(active)}
          </div>
        </div>
      );
    },
  }
)();

// ─── Icon Block ───────────────────────────────────────────────────────────────

export const iconBlockSpec = createReactBlockSpec(
  {
    type: 'iconBlock' as const,
    propSchema: {
      ...defaultProps,
      iconName:  { default: 'hugeicons:star' },
      iconSize:  { default: 48 },
      iconColor: { default: '' },
      align:     { default: 'left' as string },
    },
    content: 'none',
  },
  {
    render: ({ block }) => {
      const { iconName, iconSize, iconColor, align } = block.props;
      const size = Number(iconSize) || 48;
      const justifyMap: Record<string, string> = { center: 'justify-center', right: 'justify-end', left: 'justify-start' };
      return (
        <div className={`flex ${justifyMap[align as string] || 'justify-start'} w-full my-2`}>
          <iconify-icon
            icon={String(iconName || 'hugeicons:star')}
            width={size}
            height={size}
            style={{ color: iconColor ? String(iconColor) : 'var(--foreground)' }}
          />
        </div>
      );
    },
  }
)();

// ─── Code Group ───────────────────────────────────────────────────────────────

export const codeGroupBlockSpec = createReactBlockSpec(
  {
    type: 'codeGroup' as const,
    propSchema: {
      ...defaultProps,
      tabs: { 
        default: [] as Array<{ label: string; language: string; code: string }>,
      },
    },
    content: 'none',
  } as any,
  {
    render: ({ block }) => {
      const tabs = (block.props.tabs as Array<{ label: string; language: string; code: string }>) || [];
      const [activeTab, setActiveTab] = useState(0);
      
      if (tabs.length === 0) return null;

      return (
        <>
          <style>{`
            @font-face {
              font-family: 'Geist Mono';
              src: url('/Geist_Mono/GeistMono-VariableFont_wght.ttf') format('truetype-variations');
              font-weight: 100 900;
              font-style: normal;
              font-display: swap;
            }
            .code-group-mono {
              font-family: 'Geist Mono', ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
            }
          `}</style>
          <div className="w-full rounded-xl overflow-hidden my-4" data-code-group="" style={{
            border: '1px solid var(--code-block-border, hsl(0 0% 15%))',
          }}>
            {/* Tab bar */}
            <div className="flex items-center justify-between border-b" style={{
              borderColor: 'var(--code-block-border, hsl(0 0% 15%))',
              backgroundColor: 'var(--code-block-header-bg, hsl(0 0% 9%))',
              minHeight: '2.25rem',
              padding: '0 0.25rem',
            }}>
              {/* Tabs */}
              <div className="flex items-center">
                {tabs.map((tab, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className="code-group-mono px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap"
                    style={{
                      borderBottomColor: activeTab === idx ? 'var(--viewer-primary, #ea4e1e)' : 'transparent',
                      color: activeTab === idx ? 'var(--foreground)' : 'hsl(var(--muted-foreground))',
                      background: 'transparent',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {/* Copy button */}
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(tabs[activeTab]?.code || '')}
                className="code-group-mono flex items-center gap-1.5 mr-2 px-2.5 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--muted-foreground))',
                  background: 'transparent',
                  fontSize: '0.6875rem',
                }}
              >
                <iconify-icon icon="hugeicons:copy-01" width="12" height="12" />
                Copy
              </button>
            </div>

            {/* Code */}
            <pre className="p-4 text-xs code-group-mono overflow-x-auto leading-relaxed max-h-[400px] overflow-y-auto m-0" style={{
              backgroundColor: 'var(--code-block-bg, hsl(0 0% 7%))',
              color: 'var(--foreground)',
              borderRadius: 0,
            }}>
              {tabs[activeTab]?.code}
            </pre>
          </div>
        </>
      );
    },
  }
)();

// ─── Expandable ───────────────────────────────────────────────────────────────

export const expandableBlockSpec = createReactBlockSpec(
  {
    type: 'expandable' as const,
    propSchema: {
      ...defaultProps,
      title: { default: 'Show properties' },
    },
    content: 'inline',
  },
  {
    render: ({ block, contentRef }) => {
      const { title } = block.props;
      const [open, setOpen] = useState(false);
      return (
        <div className="w-full my-2 ml-4 border-l-2 border-border pl-4">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer select-none mb-2"
            style={{ outline: 'none', boxShadow: 'none', border: 'none' }}
          >
            <iconify-icon
              icon="hugeicons:arrow-right-01"
              width="14" height="14"
              style={{ transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}
            />
            <span className="font-medium">{title || 'Show properties'}</span>
          </button>
          {open && (
            <div ref={contentRef} className="text-sm" />
          )}
        </div>
      );
    },
  }
)();

// ─── Param Field ──────────────────────────────────────────────────────────────

export const paramFieldBlockSpec = createReactBlockSpec(
  {
    type: 'paramField' as const,
    propSchema: {
      ...defaultProps,
      paramName: { default: '' },
      paramType: { default: 'string' },
      required: { default: false },
      location: { default: 'body' }, // body, query, header, path
    },
    content: 'inline',
  },
  {
    render: ({ block, contentRef }) => {
      const { paramName, paramType, required } = block.props;
      
      return (
        <div className="w-full my-3 pl-0">
          <div className="flex items-center gap-2 mb-1.5">
            <code className="text-sm font-mono font-semibold" style={{ color: '#f97316' }}>
              {paramName || 'parameter'}
            </code>
            <span className="text-[11px] px-2 py-0.5 rounded font-mono font-medium bg-muted text-muted-foreground">
              {paramType}
            </span>
            {required && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                required
              </span>
            )}
          </div>
          <div ref={contentRef} className="text-sm text-muted-foreground leading-relaxed" />
        </div>
      );
    },
  }
)();

// ─── Response Field ───────────────────────────────────────────────────────────

export const responseFieldBlockSpec = createReactBlockSpec(
  {
    type: 'responseField' as const,
    propSchema: {
      ...defaultProps,
      fieldName: { default: '' },
      fieldType: { default: 'string' },
      required: { default: false },
    },
    content: 'inline',
  },
  {
    render: ({ block, contentRef }) => {
      const { fieldName, fieldType, required } = block.props;
      
      return (
        <div className="w-full my-3 pl-0">
          <div className="flex items-center gap-2 mb-1.5">
            <code className="text-sm font-mono font-semibold" style={{ color: '#f97316' }}>
              {fieldName || 'field'}
            </code>
            <span className="text-[11px] px-2 py-0.5 rounded font-mono font-medium bg-muted text-muted-foreground">
              {fieldType}
            </span>
            {required && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                required
              </span>
            )}
          </div>
          <div ref={contentRef} className="text-sm text-muted-foreground leading-relaxed" />
        </div>
      );
    },
  }
)();

// ─── Card Group ───────────────────────────────────────────────────────────────

export const cardGroupBlockSpec = createReactBlockSpec(
  {
    type: 'cardGroup' as const,
    propSchema: {
      ...defaultProps,
      columns: { default: 2 },
      cards: { default: '[]' }, // Store as JSON string to avoid type issues
    },
    content: 'none',
  },
  {
    render: ({ block }) => {
      const columns = Math.max(2, Math.min(3, Number(block.props.columns) || 2));
      // Parse cards from JSON string
      let cards: Array<{ icon: string; title: string; body: string; href: string; imageUrl: string }> = [];
      try {
        const cardsData = block.props.cards;
        cards = typeof cardsData === 'string' ? JSON.parse(cardsData) : (Array.isArray(cardsData) ? cardsData : []);
      } catch {
        cards = [];
      }
      
      const gridClass = columns === 3 ? 'grid-cols-3' : 'grid-cols-2';

      return (
        <div className="w-full my-4" data-card-group="">
          <div className={`grid ${gridClass} gap-4`}>
            {cards.map((card, idx) => {
              const CardWrapper = card.href ? 'a' : 'div';
              const linkProps = card.href ? { href: card.href, target: '_blank', rel: 'noopener noreferrer' } : {};
              
              return (
                <CardWrapper
                  key={idx}
                  {...linkProps}
                  className="rounded-2xl border border-border bg-card hover:shadow-md transition-shadow flex flex-col"
                  style={{ textDecoration: 'none' }}
                >
                  {card.imageUrl && (
                    <div className="w-full overflow-hidden rounded-t-2xl">
                      <img src={card.imageUrl} alt="" className="w-full h-32 object-cover" />
                    </div>
                  )}
                  <div className="p-4 flex flex-col flex-1">
                    {card.icon && (
                      <span className="mb-2 block" style={{ color: 'var(--viewer-primary, #3b82f6)' }}>
                        <iconify-icon icon={card.icon} width="24" height="24" />
                      </span>
                    )}
                    {card.title && <div className="font-semibold text-sm text-foreground mb-1">{card.title}</div>}
                    {card.body && <div className="text-xs text-muted-foreground leading-relaxed">{card.body}</div>}
                    {card.href && (
                      <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: 'var(--viewer-primary, #3b82f6)' }}>
                        <iconify-icon icon="hugeicons:link-01" width="12" height="12" />
                        <span className="truncate opacity-60">{card.href}</span>
                      </div>
                    )}
                  </div>
                </CardWrapper>
              );
            })}
          </div>
        </div>
      );
    },
  }
)();

// ─── Image with Border Radius ─────────────────────────────────────────────────

export const imageBlockSpec = createReactBlockSpec(
  {
    type: 'image' as const,
    propSchema: {
      ...defaultProps,
      url: { default: '' },
      caption: { default: '' },
      width: { default: '100%' },
      borderRadius: { default: 0 },
    },
    content: 'none',
  },
  {
    render: ({ block }) => {
      const { url, caption, width } = block.props;
      // Ensure borderRadius is properly extracted and converted to number
      const borderRadius = block.props.borderRadius;
      const radius = typeof borderRadius === 'number' ? borderRadius : (typeof borderRadius === 'string' ? parseInt(borderRadius, 10) : 0);
      
      if (!url) return null;
      
      return (
        <div 
          data-image-block="" 
          style={{ 
            width: '100%', 
            margin: '0.5rem 0',
            position: 'relative',
          }}
        >
          <div style={{ 
            position: 'relative',
            width: '100%',
            pointerEvents: 'none',
          }}>
            <img
              src={url}
              alt={caption || ''}
              style={{
                width: '100%',
                height: 'auto',
                maxWidth: width || '100%',
                borderRadius: radius > 0 ? `${radius}px` : '0.75rem',
                display: 'block',
                border: '1px solid hsl(var(--border))',
                pointerEvents: 'auto',
              }}
            />
          </div>
          {caption && (
            <div style={{ 
              width: '100%', 
              marginTop: '0.5rem', 
              fontSize: '0.875rem', 
              textAlign: 'center', 
              color: 'var(--muted-foreground)' 
            }}>
              {caption}
            </div>
          )}
        </div>
      );
    },
  }
)();

