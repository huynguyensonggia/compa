/**
 * Category icon shown before a project category name: an image uploaded in the admin
 * (transparent PNG or SVG stored as a data URL). Decorative: the category name next to it carries the meaning.
 */

export const CUSTOM_ICON = 'custom';

/**
 * Uploaded icons are tinted with the text colour through a CSS mask, unless keepColor is set,
 * in which case the image is shown with its own colours.
 */
export function TypeIcon({
  type,
  className,
}: {
  type: { icon?: string; iconImage?: string; iconKeepColor?: boolean };
  className?: string;
}) {
  if (type.icon !== CUSTOM_ICON || !type.iconImage) return null;
  if (type.iconKeepColor) return <img className={`${className ?? ''} is-custom`} src={type.iconImage} alt="" aria-hidden="true" />;
  const url = `url("${type.iconImage.replace(/"/g, '%22')}")`;
  // The hidden <img> gives the box the icon's own proportions; the visible colour comes from the mask.
  return (
    <span className={`${className ?? ''} is-custom is-mask`} style={{ WebkitMaskImage: url, maskImage: url }} aria-hidden="true">
      <img src={type.iconImage} alt="" />
    </span>
  );
}
