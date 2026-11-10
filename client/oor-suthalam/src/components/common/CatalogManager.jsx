import { useEffect, useRef, useState } from 'react';
import useResource from '../../hooks/useResource';
import { money, formatDate } from '../../utils/format';
import Resource from './Resource';
import Button from './Button';
import AdminIcon from './AdminIcon';
import PhotoUpload from './PhotoUpload';

export default function CatalogManager({
  title,
  service,
  fields,
  buildBody,
  toForm,
  labelKey = 'name',
  removeLabel = 'Delete',
  prerequisite = null,
}) {
  const resource = useResource(service.list);
  const [editing, setEditing] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [formVersion, setFormVersion] = useState(0);
  const dialog = useRef(null);
  const cleanTitle = title.replace(/\.$/, '');
  const singular = cleanTitle === 'Destinations' ? 'destination' : 'package';

  useEffect(() => {
    if (editorOpen && !dialog.current.open) dialog.current.showModal();
    if (!editorOpen && dialog.current.open) dialog.current.close();
  }, [editorOpen]);

  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError('');
    setMessage('');
    let savingField = '';
    try {
      for (const field of fields.filter((field) => field.type === 'file')) {
        const file = values[`${field.name}File`];
        delete values[`${field.name}File`];
        if (file?.size) {
          savingField = 'Image';
          if (
            !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
            file.size > 5 * 1024 * 1024
          )
            throw new Error('Choose a JPEG, PNG or WebP photo up to 5 MB.');
          values[field.name] = (await service.uploadImage(file)).image;
        }
      }
      const body = buildBody(values);
      savingField = '';
      const previous = editing ? buildBody(toForm(editing)) : {};
      const normalize = (value) =>
        JSON.stringify(typeof value === 'string' ? value.trim() : value);
      const changed = fields
        .filter(
          (field) => normalize(body[field.name]) !== normalize(previous[field.name]),
        )
        .map((field) =>
          field.type === 'file' ? 'Image' : field.label.replace(/\s*\([^)]*\)/g, ''),
        );
      if (editing) await service.update(editing._id, body);
      else await service.create(body);
      setEditorOpen(false);
      setEditing(null);
      setFormVersion((value) => value + 1);
      setMessage(
        editing
          ? changed.length
            ? `${changed.join(', ')} saved successfully.`
            : 'No changes were needed. Your entry is already up to date.'
          : `New ${singular} created successfully.`,
      );
      resource.reload();
    } catch (err) {
      setError(
        `${savingField ? savingField + ': ' : ''}${err.message || 'Unable to save. Please try again.'}`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove(item) {
    if (!window.confirm(`${removeLabel} "${item[labelKey]}"?`)) return;
    setBusyId(item._id);
    setError('');
    setMessage('');
    try {
      await service.remove(item._id);
      setMessage(`${removeLabel} completed.`);
      resource.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  function openEditor(item = null) {
    setEditing(item);
    setError('');
    setMessage('');
    setFormVersion((value) => value + 1);
    setEditorOpen(true);
  }
  const values = editing ? toForm(editing) : {};

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h1>{cleanTitle}</h1>
          <p>Manage catalog details, photos and availability.</p>
        </div>
        <Button onClick={() => openEditor()}>
          <AdminIcon name="plus" size={16} />
          Add {singular}
        </Button>
      </div>
      {!editorOpen && error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="notice success" role="status">
          {message}
        </p>
      )}
      <section className="admin-card">
        <div className="admin-toolbar">
          <label className="admin-search">
            <AdminIcon name="search" size={17} />
            <input
              aria-label={`Search ${cleanTitle.toLowerCase()}`}
              placeholder={`Search ${cleanTitle.toLowerCase()}…`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <span className="admin-soft-label">
            {resource.data?.length || 0} available entries
          </span>
        </div>
        <Resource
          resource={resource}
          empty={`Your collection is ready for its first ${singular}. Use the Add button to create one.`}
        >
          {(items) => {
            const filtered = items.filter((item) =>
              `${item[labelKey]} ${item.region || item.destination?.name || ''} ${item.category || ''}`
                .toLowerCase()
                .includes(query.trim().toLowerCase()),
            );
            return (
              <>
                <div className="admin-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>{singular === 'destination' ? 'Destination' : 'Package'}</th>
                        <th>
                          {singular === 'destination'
                            ? 'Category / region'
                            : 'Duration / destination'}
                        </th>
                        <th>
                          {singular === 'destination'
                            ? 'Daily estimate'
                            : 'Price / person'}
                        </th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item) => (
                        <tr key={item._id}>
                          <td className="admin-row-name">
                            <strong>{item[labelKey]}</strong>
                            <small>{item.description}</small>
                          </td>
                          <td>
                            {singular === 'destination' ? (
                              <>
                                <span className="admin-category">{item.category}</span>
                                <small>{item.region}</small>
                              </>
                            ) : (
                              <>
                                <strong>{item.days} days</strong>
                                <small>
                                  {item.destination?.name || 'Unavailable destination'}
                                </small>
                              </>
                            )}
                          </td>
                          <td className="admin-money">
                            {item.priceMode === 'quote'
                              ? 'Quote required'
                              : item.dailyBudget === 0
                                ? 'Budget on request'
                                : money(item.dailyBudget ?? item.price)}
                            <small>
                              {item.updatedAt
                                ? `Updated ${formatDate(item.updatedAt)}`
                                : ''}
                            </small>
                          </td>
                          <td>
                            <div className="admin-row-actions">
                              <Button
                                className="secondary"
                                disabled={busy || Boolean(busyId)}
                                onClick={() => openEditor(item)}
                              >
                                <AdminIcon name="edit" size={12} />
                                Edit
                              </Button>
                              <Button
                                className="danger"
                                busy={busyId === item._id}
                                disabled={busy || Boolean(busyId)}
                                onClick={() => remove(item)}
                              >
                                {removeLabel}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!filtered.length && (
                        <tr>
                          <td colSpan="4">
                            <div className="admin-empty-results">
                              <AdminIcon name="search" size={26} />
                              <h3>No matching entries</h3>
                              <p>Try another name, region, or category.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="admin-table-meta">
                  Showing {filtered.length} of {items.length} available entries
                </div>
              </>
            );
          }}
        </Resource>
      </section>
      <dialog
        className="admin-editor"
        ref={dialog}
        aria-labelledby="admin-editor-title"
        onCancel={() => setEditorOpen(false)}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
      >
        <div className="admin-editor-head">
          <div>
            <h2 id="admin-editor-title">
              {editing ? 'Edit' : 'Add'} {singular}
            </h2>
          </div>
          <button
            aria-label="Close editor"
            disabled={busy}
            onClick={() => setEditorOpen(false)}
          >
            <AdminIcon name="close" size={18} />
          </button>
        </div>
        <form
          className="stack"
          onSubmit={submit}
          onInvalid={(event) => {
            const field = fields.find(
              (item) =>
                event.target.name === item.name ||
                event.target.name === item.name + 'File',
            );
            setError(
              (field?.type === 'file' ? 'Image' : field?.label || 'Field') +
                ': ' +
                event.target.validationMessage,
            );
          }}
          key={`${editing?._id || 'new'}-${formVersion}`}
        >
          {prerequisite && <div className="admin-prerequisite">{prerequisite}</div>}
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
          <div className="form-grid">
            {fields.map((field) => (
              <label key={field.name}>
                {field.label}
                {field.type === 'file' ? (
                  <PhotoUpload name={field.name} current={values[field.name] || ''} />
                ) : field.type === 'textarea' ? (
                  <textarea
                    name={field.name}
                    required={field.required !== false}
                    defaultValue={values[field.name] ?? ''}
                    rows="3"
                    minLength={field.minLength}
                    maxLength={field.maxLength}
                  />
                ) : field.options ? (
                  <select
                    name={field.name}
                    required={field.required !== false}
                    defaultValue={values[field.name] ?? ''}
                  >
                    <option value="" disabled>
                      Select {field.label}
                    </option>
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    name={field.name}
                    type={field.type || 'text'}
                    step={field.step}
                    required={field.required !== false}
                    defaultValue={values[field.name] ?? ''}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    minLength={field.minLength}
                    maxLength={field.maxLength}
                  />
                )}
                {field.hint && <small>{field.hint}</small>}
              </label>
            ))}
          </div>
          <div className="actions">
            <Button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => setEditorOpen(false)}
            >
              Cancel
            </Button>
            <Button busy={busy} disabled={Boolean(prerequisite)}>
              {editing ? 'Save changes' : `Create ${singular}`}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
