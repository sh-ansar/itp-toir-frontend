// Print only fictional, explicitly supplied table data from the public demo.
export function printPublicDemo({ title, lang, headers, rows, note }) {
  if (typeof document === 'undefined') return
  const escapeHtml = input => String(input ?? '').replace(/[&<>"']/g, character =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]))
  const columns = headers.map(value => '<th>' + escapeHtml(value) + '</th>').join('')
  const body = rows.map(row => '<tr>' + row.map(value => '<td>' + escapeHtml(value) + '</td>').join('') + '</tr>').join('')
  const markup = '<!doctype html><html lang="' + escapeHtml(lang) + '"><head><meta charset="utf-8"><title>' +
    escapeHtml(title) + '</title><style>body{font:13px Arial,sans-serif;color:#193b4b;padding:15px}' +
    'h1{font-size:21px;margin-bottom:8px}p{color:#627f8c;font-size:11px}' +
    'table{width:100%;border-collapse:collapse;margin-top:24px}th,td{border:1px solid #d8e7ed;padding:11px;text-align:left}' +
    'th{background:#eef6f9}@page{size:A4 portrait;margin:12mm}</style></head><body><h1>' +
    escapeHtml(title) + '</h1><p>ITP ТОиР · ' + escapeHtml(note) +
    '</p><table><thead><tr>' + columns + '</tr></thead><tbody>' + body + '</tbody></table></body></html>'
  const frame = document.createElement('iframe')
  frame.setAttribute('title', title)
  frame.style.cssText = 'position:fixed;left:-9999px;top:0;width:0;height:0;border:0;'
  document.body.appendChild(frame)
  frame.contentDocument.open()
  frame.contentDocument.write(markup)
  frame.contentDocument.close()
  const cleanup = () => frame.remove()
  frame.contentWindow.addEventListener('afterprint', cleanup, { once: true })
  window.setTimeout(() => {
    try { frame.contentWindow.focus(); frame.contentWindow.print() }
    catch { cleanup() }
  }, 40)
  window.setTimeout(cleanup, 120000)
}
