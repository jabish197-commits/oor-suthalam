import { useEffect, useState } from 'react';

export default function PhotoUpload({ name, current = '' }) {
  const [preview, setPreview] = useState('');
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  return (
    <>
      <input type="hidden" name={name} value={current} />
      <input
        type="file"
        name={`${name}File`}
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => {
          const file = event.target.files[0];
          const valid =
            !file ||
            (['image/jpeg', 'image/png', 'image/webp'].includes(file.type) &&
              file.size <= 5 * 1024 * 1024);
          event.target.setCustomValidity(
            valid ? '' : 'Choose a JPEG, PNG or WebP photo up to 5 MB.',
          );
          setPreview(valid && file ? URL.createObjectURL(file) : '');
          if (!valid) event.target.reportValidity();
        }}
      />
      {(preview || current) && (
        <img
          src={preview || current}
          alt="Destination photo preview"
          style={{ width: '100%', maxHeight: 180, objectFit: 'contain', borderRadius: 8 }}
        />
      )}
    </>
  );
}
