'use client';

/**
 * Landing reveal wrappers used to animate on scroll. They now render immediately
 * so the marketing page paints as one piece instead of fading in section by section.
 */

const STATIC_TAGS = {
  section: 'section',
  header: 'header',
  footer: 'footer',
  main: 'main',
  div: 'div',
};

function StaticBox({ as = 'div', className = '', style, children }) {
  const Tag = STATIC_TAGS[as] || 'div';
  return (
    <Tag className={className} style={style}>
      {children}
    </Tag>
  );
}

export function ScrollReveal({
  children,
  className = '',
  as = 'div',
}) {
  return (
    <StaticBox as={as} className={className}>
      {children}
    </StaticBox>
  );
}

export function ScrollStagger({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

export function ScrollItem({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

export function HeroReveal({ children, className = '', style }) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
