'use client'

import { useState, useRef } from 'react'
import Editor from '@monaco-editor/react'

// ============================================
// PARSE LATEX TO EXTRACT CONTENT (ROBUST)
// ============================================
function parseLatex(latex) {
  const data = {
    name: '',
    title: '',
    contact: '',
    sections: []
  }

  if (!latex) return data

  try {
    // Extract name
    const nameMatch = latex.match(/\\Large[^}]*\\textbf\{([^}]+)\}/)
    if (nameMatch) data.name = nameMatch[1].trim()

    // Extract center environment content
    const centerMatch = latex.match(/\\begin\{center\}([\s\S]*?)\\end\{center\}/)
    if (centerMatch) {
      const centerContent = centerMatch[1]
      const lines = centerContent
        .split('\\\\')
        .map(l => l.replace(/\[[\d.]+cm\]/g, '').trim())
        .filter(l => l && !l.includes('\\Large') && !l.includes('\\textbf'))
      
      if (lines.length > 0) data.title = lines[0].replace(/[{}]/g, '').trim()
      if (lines.length > 1) data.contact = lines[1].replace(/[{}]/g, '').trim()
    }

    // Extract sections
    const sectionRegex = /\\section\*\{+([^}]+)\}+([\s\S]*?)(?=\\section\*|\\end\{document\})/g
    let match
    
    while ((match = sectionRegex.exec(latex)) !== null) {
      const title = match[1].trim()
      let content = match[2].trim()

      const itemizeMatch = content.match(/\\begin\{itemize\}(?:\[leftmargin=\*\])?([\s\S]*?)\\end\{itemize\}/)
      
      if (itemizeMatch) {
        const itemsText = itemizeMatch[1]
        const items = itemsText
          .split('\\item')
          .filter(item => item.trim())
          .map(item => {
            let cleaned = item.trim()
            cleaned = cleaned.replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>')
            cleaned = cleaned.replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>')
            return cleaned.split('\\\\').map(line => line.trim()).filter(line => line)
          })
        
        data.sections.push({ title, type: 'list', items })
      } else {
        const cleaned = content
          .replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>')
          .replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>')
          .trim()
        
        data.sections.push({ title, type: 'text', content: cleaned })
      }
    }

    console.log('✅ Parsed LaTeX successfully:', data)
    return data

  } catch (error) {
    console.error('❌ LaTeX parsing error:', error)
    console.error('LaTeX content:', latex.substring(0, 500))
    return data
  }
}

// ============================================
// HTML RESUME PREVIEW FROM LATEX
// ============================================
function ResumePreview({ parsedData }) {
  if (!parsedData || !parsedData.name) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm p-10 text-center">
        Click "Generate Resume Preview" to see the formatted resume
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto text-black bg-white px-20 py-15">
      <div className="max-w-4xl mx-auto font-serif text-sm leading-relaxed">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-gray-800 pb-5">
          <h1 className="text-3xl font-bold mb-2">{parsedData.name}</h1>
          {parsedData.title && (
            <div className="text-base text-gray-600 mb-2">{parsedData.title}</div>
          )}
          {parsedData.contact && (
            <div className="text-xs text-gray-500">{parsedData.contact}</div>
          )}
        </div>

        {/* Sections */}
        {parsedData.sections.map((section, idx) => (
          <div key={idx} className="mb-6">
            <h2 className="text-lg font-bold border-b border-gray-800 pb-1 mb-2.5">
              {section.title}
            </h2>
            
            {section.type === 'list' ? (
              <ul className="m-0 pl-5 list-disc">
                {section.items.map((item, i) => (
                  <li key={i} className="mb-3">
                    {Array.isArray(item) ? (
                      <>
                        <div dangerouslySetInnerHTML={{ __html: item[0] }} />
                        {item.slice(1).map((line, j) => (
                          line && (
                            <div 
                              key={j} 
                              className="mt-1 text-gray-600 text-xs" 
                              dangerouslySetInnerHTML={{ __html: line }} 
                            />
                          )
                        ))}
                      </>
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: item }} />
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="m-0" dangerouslySetInnerHTML={{ __html: section.content }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function ResumeEditor() {
  const [form, setForm] = useState({
    name: '', title: '', email: '', phone: '',
    summary: '', jobs: '', projects: '', skills: ''
  })
  const [latex, setLatex] = useState('')
  const [lastGeneratedLatex, setLastGeneratedLatex] = useState('')
  const [parsedData, setParsedData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const latexChanged = latex !== lastGeneratedLatex && latex.length > 0

  // ============================================
  // GENERATE LATEX
  // ============================================
  const generateLatex = async () => {
    if (!form.name || !form.email) {
      setError('Name and email are required')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    setParsedData(null)
    
    try {
      const response = await fetch('/api/gen_resume?action=generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Generation failed')
      }
      
      if (data.latex) {
        setLatex(data.latex)
        
        if (data.usedFallback) {
          setSuccess(`⚠️ ${data.warning || 'Using template fallback'}. LaTeX generated! Click "Generate Resume Preview".`)
        } else {
          setSuccess('✨ LaTeX generated by AI! Click "Generate Resume Preview" to see it.')
        }
      }
    } catch (err) {
      setError(err.message)
      console.error('Generation error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // GENERATE RESUME PREVIEW FROM LATEX
  // ============================================
  const generatePreview = () => {
    if (!latex) {
      setError('No LaTeX code to preview')
      return
    }

    setError(null)
    setSuccess(null)

    try {
      const parsed = parseLatex(latex)
      setParsedData(parsed)
      setLastGeneratedLatex(latex)
      setSuccess('✓ Resume preview generated!')
    } catch (err) {
      setError('Failed to parse LaTeX: ' + err.message)
      console.error('Parse error:', err)
    }
  }

  // ============================================
  // DOWNLOAD LATEX FILE
  // ============================================
  const downloadLatex = () => {
    const blob = new Blob([latex], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'resume.tex'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ============================================
  // DOWNLOAD AS PDF (Using browser print)
  // ============================================
  const downloadPdf = () => {
    if (!parsedData || !parsedData.name) {
      setError('Generate resume preview first before downloading PDF')
      return
    }

    const iframe = document.createElement('iframe')
    iframe.className = 'fixed right-0 bottom-0 w-0 h-0 border-0'
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentWindow.document

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Resume</title>
  <style>
    @page { size: A4; margin: 0.5in; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Georgia, serif; font-size: 12pt; line-height: 1.6; color: #000; }
    .resume { max-width: 7.5in; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 0.3in; border-bottom: 2pt solid #000; padding-bottom: 0.2in; }
    .header h1 { font-size: 24pt; font-weight: bold; margin: 0 0 0.1in 0; }
    .header .title { font-size: 14pt; color: #333; margin-bottom: 0.05in; }
    .header .contact { font-size: 11pt; color: #555; }
    .section { margin-bottom: 0.25in; page-break-inside: avoid; }
    .section h2 { font-size: 16pt; font-weight: bold; border-bottom: 1pt solid #000; padding-bottom: 0.05in; margin-bottom: 0.1in; }
    .section ul { margin: 0; padding-left: 0.3in; list-style-type: disc; }
    .section li { margin-bottom: 0.1in; }
    .section .detail { margin-top: 0.03in; color: #333; font-size: 11pt; }
    .section p { margin: 0; }
  </style>
</head>
<body>
  <div class="resume">
    <div class="header">
      <h1>${parsedData.name}</h1>
      ${parsedData.title ? `<div class="title">${parsedData.title}</div>` : ''}
      ${parsedData.contact ? `<div class="contact">${parsedData.contact}</div>` : ''}
    </div>
    
    ${parsedData.sections.map(section => `
      <div class="section">
        <h2>${section.title}</h2>
        ${section.type === 'list' ? `
          <ul>
            ${section.items.map(item => {
              if (Array.isArray(item)) {
                return `<li>
                  ${item[0]}
                  ${item.slice(1).filter(line => line).map(line => `<div class="detail">${line}</div>`).join('')}
                </li>`
              }
              return `<li>${item}</li>`
            }).join('')}
          </ul>
        ` : `<p>${section.content}</p>`}
      </div>
    `).join('')}
  </div>
</body>
</html>`

    iframeDoc.open()
    iframeDoc.write(htmlContent)
    iframeDoc.close()

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
        setTimeout(() => document.body.removeChild(iframe), 100)
      }, 250)
    }

    setSuccess('✓ PDF print dialog opened! Save as PDF to download.')
  }

  // ============================================
  // LOAD SAMPLE DATA
  // ============================================
  const loadSample = () => {
    setForm({
      name: 'John Doe',
      title: 'Senior Software Engineer',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      summary: 'Experienced software engineer with 8+ years in full-stack development, specializing in React, Node.js, and cloud architecture.',
      jobs: 'Senior Engineer | Tech Corp | 2020-Present | Led team of 5 developers building scalable microservices\nSoftware Engineer | StartupXYZ | 2017-2020 | Built e-commerce platform handling 50K daily users',
      projects: 'E-commerce Platform | React, Node.js, PostgreSQL | Scaled to 10K concurrent users\nML Pipeline | Python, TensorFlow | Achieved 95% accuracy in classification',
      skills: 'JavaScript, Python, React, Node.js, Docker, AWS, PostgreSQL, MongoDB, Kubernetes'
    })
    setError(null)
    setSuccess(null)
  }

  // ============================================
  // RENDER UI
  // ============================================
  return (
    <main className="flex h-screen overflow-hidden font-sans">
      {/* LEFT SIDEBAR - FORM */}
      <aside className="w-[340px] p-5 border-r border-gray-200 overflow-auto bg-gray-50">
        <h1 className="text-2xl text-black mb-5 font-semibold">Resume Editor</h1>
        
        {error && (
          <div className="text-red-600 text-xs p-2.5 bg-red-50 rounded mb-3 border border-red-200">
            {error}
          </div>
        )}
        
        {success && (
          <div className="text-green-600 text-xs p-2.5 bg-green-50 rounded mb-3 border border-green-200">
            {success}
          </div>
        )}
        
        <button 
          onClick={loadSample} 
          className="w-full py-2.5 bg-gray-500 text-white border-0 rounded cursor-pointer mb-4 text-sm font-medium hover:bg-gray-600 transition-colors"
        >
          📋 Load Sample Data
        </button>

        <div className="mb-3 text-black">
          <h3 className="text-xs mb-2 text-gray-600 font-semibold">Personal Info</h3>
          <input 
            placeholder="Full Name *" 
            value={form.name} 
            onChange={(e) => setForm({...form, name: e.target.value})} 
            className="w-full p-2 mb-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
          <input 
            placeholder="Job Title" 
            value={form.title} 
            onChange={(e) => setForm({...form, title: e.target.value})} 
            className="w-full p-2 mb-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
          <input 
            type="email" 
            placeholder="Email *" 
            value={form.email} 
            onChange={(e) => setForm({...form, email: e.target.value})} 
            className="w-full p-2 mb-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
          <input 
            placeholder="Phone" 
            value={form.phone} 
            onChange={(e) => setForm({...form, phone: e.target.value})} 
            className="w-full p-2 mb-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
        </div>

        <div className="mb-3 text-black">
          <h3 className="text-xs mb-2 text-gray-600 font-semibold">Summary</h3>
          <textarea 
            placeholder="Brief summary..." 
            value={form.summary} 
            onChange={(e) => setForm({...form, summary: e.target.value})} 
            rows={3} 
            className="w-full p-2 border border-gray-300 rounded font-sans text-xs resize-y focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
        </div>

        <div className="mb-3 text-black">
          <h3 className="text-xs mb-2 text-gray-600 font-semibold">Work Experience</h3>
          <textarea 
            placeholder="Job | Company | Dates | Description" 
            value={form.jobs} 
            onChange={(e) => setForm({...form, jobs: e.target.value})} 
            rows={4} 
            className="w-full p-2 border border-gray-300 rounded font-mono text-xs resize-y focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
        </div>

        <div className="mb-3 text-black">
          <h3 className="text-xs mb-2 text-gray-600 font-semibold">Projects</h3>
          <textarea 
            placeholder="Project | Tech | Description" 
            value={form.projects} 
            onChange={(e) => setForm({...form, projects: e.target.value})} 
            rows={3} 
            className="w-full p-2 border border-gray-300 rounded font-mono text-xs resize-y focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
        </div>

        <div className="mb-3 text-black">
          <h3 className="text-xs mb-2 text-gray-600 font-semibold">Skills</h3>
          <textarea 
            placeholder="Comma-separated skills" 
            value={form.skills} 
            onChange={(e) => setForm({...form, skills: e.target.value})} 
            rows={2} 
            className="w-full p-2 border border-gray-300 rounded font-sans text-xs resize-y focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
        </div>

        <button 
          onClick={generateLatex} 
          disabled={loading} 
          className="w-full py-3 bg-blue-600 text-white border-0 rounded font-semibold text-sm mb-2 disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
        >
          {loading ? '⏳ Generating...' : '✨ Generate LaTeX'}
        </button>

        <button 
          onClick={generatePreview} 
          disabled={!latex || !latexChanged}
          className="w-full py-3 bg-emerald-500 text-white border-0 rounded font-semibold text-sm mb-2 disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-emerald-600 transition-colors"
        >
          📄 Generate Resume Preview
        </button>

        {latex && (
          <button 
            onClick={downloadLatex} 
            className="w-full py-3 bg-violet-600 text-white border-0 rounded font-semibold text-sm mb-2 hover:bg-violet-700 transition-colors"
          >
            ⬇ Download LaTeX (.tex)
          </button>
        )}

        {parsedData && (
          <button 
            onClick={downloadPdf} 
            className="w-full py-3 bg-pink-600 text-white border-0 rounded font-semibold text-sm hover:bg-pink-700 transition-colors"
          >
            📥 Download as PDF
          </button>
        )}
      </aside>

      {/* MIDDLE - LATEX EDITOR */}
      <section className="flex-1 flex flex-col border-r border-gray-200">
        <div className="py-3 px-4 text-black bg-gray-100 border-b border-gray-200 font-medium text-sm flex justify-between items-center">
          <span>LaTeX Source Code (Editable)</span>
          {latexChanged && (
            <span className="text-xs text-amber-600 bg-amber-50 py-1 px-2 rounded">
              Modified - Click Generate Preview
            </span>
          )}
        </div>
        <Editor
          height="100%"
          defaultLanguage="latex"
          value={latex}
          onChange={(value) => setLatex(value || '')}
          theme="vs-light"
          options={{ 
            minimap: { enabled: false }, 
            fontSize: 13, 
            wordWrap: 'on', 
            automaticLayout: true, 
            lineNumbers: 'on' 
          }}
        />
      </section>

      {/* RIGHT - HTML PREVIEW */}
      <section className="w-1/2 flex flex-col bg-gray-100">
        <div className="py-3 px-4 text-black bg-gray-100 border-b border-gray-200 font-medium text-sm">
          Resume Preview
        </div>
        <ResumePreview parsedData={parsedData} />
      </section>
    </main>
  )
}
