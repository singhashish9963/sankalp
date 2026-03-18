import { NextResponse } from 'next/server'

export async function POST(request) {
  const url = new URL(request.url)
  const action = url.searchParams.get('action')

  if (action === 'generate') {
    return handleGenerate(request)
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
}

async function handleGenerate(request) {
  try {
    const { form } = await request.json()

    if (!form.name || !form.email) {
      return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
    }

    console.log('🤖 Calling LLM to generate LaTeX...')

    const prompt = buildLatexPrompt(form)

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct',
        messages: [
          { 
            role: 'system', 
            content: 'You are a LaTeX expert. Output ONLY valid LaTeX code. No markdown, no explanations, no code blocks. Pure LaTeX only.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 4096
      })
    })

    if (!response.ok) {
      console.warn('⚠️ LLM API failed')
      return NextResponse.json({ 
        latex: generateFallbackTemplate(form),
        usedFallback: true
      })
    }

    const data = await response.json()
    let latex = data.choices?.[0]?.message?.content

    if (!latex || latex.length < 50) {
      console.warn('⚠️ LLM returned invalid response')
      return NextResponse.json({ 
        latex: generateFallbackTemplate(form),
        usedFallback: true
      })
    }

    latex = cleanLatexCode(latex)
    
    const validation = validateLatex(latex)
    if (!validation.valid) {
      console.warn('⚠️ LLM output failed validation:', validation.errors)
      console.log('📝 Using fallback template')
      return NextResponse.json({ 
        latex: generateFallbackTemplate(form),
        usedFallback: true,
        warning: validation.errors.join(', ')
      })
    }

    console.log('✅ LaTeX generated successfully via LLM')
    return NextResponse.json({ latex, usedFallback: false })

  } catch (error) {
    console.error('❌ Generation error:', error)
    try {
      const body = await request.json()
      return NextResponse.json({ 
        latex: generateFallbackTemplate(body.form),
        usedFallback: true
      })
    } catch {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }
}

function buildLatexPrompt(form) {
  return `You are creating a professional LaTeX resume. Use the DATA provided below and insert it into the LaTeX template structure.

=== USER DATA (USE THESE EXACT VALUES) ===
Name: ${form.name}
Job Title: ${form.title || 'N/A'}
Email: ${form.email}
Phone: ${form.phone || 'N/A'}
Summary: ${form.summary || 'N/A'}

Work Experience:
${form.jobs || 'N/A'}

Projects:
${form.projects || 'N/A'}

Skills: ${form.skills || 'N/A'}

=== END USER DATA ===

Now generate a LaTeX resume using this EXACT structure but replace [NAME], [TITLE], etc. with the actual data above:

\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{enumitem}
\\pagestyle{empty}
\\begin{document}

\\begin{center}
{\\Large \\textbf{[NAME]}}\\\\[0.2cm]
[TITLE]\\\\[0.1cm]
[EMAIL] | [PHONE]
\\end{center}

\\section*{Summary}
[SUMMARY_TEXT]

\\section*{Experience}
\\begin{itemize}[leftmargin=*]
[WORK_ITEMS - Format each job as: \\item \\textbf{Job Title} | Company | Dates\\\\Description]
\\end{itemize}

\\section*{Projects}
\\begin{itemize}[leftmargin=*]
[PROJECT_ITEMS - Format each as: \\item \\textbf{Project Name} | Technologies\\\\Description]
\\end{itemize}

\\section*{Skills}
[SKILLS_LIST]

\\end{document}

CRITICAL RULES:
1. Use ONLY the data from USER DATA section above
2. Do NOT invent or use example data like "John Doe" or "ABC Corporation"
3. If a field is N/A, omit that section entirely
4. Output ONLY the LaTeX code with real data inserted
5. Do NOT include markdown, code blocks, or explanations`
}

function cleanLatexCode(input) {
  let latex = input

  latex = latex.replace(/```[\s\S]*?```/g, '');
  latex = latex.replace(/```\s*/g, '');        
  latex = latex.trim();

  const docClassIndex = latex.indexOf('\\documentclass')
  if (docClassIndex > 0) {
    latex = latex.substring(docClassIndex)
  }

  const endDocIndex = latex.indexOf('\\end{document}')
  if (endDocIndex > 0) {
    latex = latex.substring(0, endDocIndex + 14)
  }

  latex = latex.replace(/\\section\*\{\{([^}]+)\}/g, '\\section*{$1}')

  latex = latex.replace(/\\section\*\{([^}]+)$/gm, '\\section*{$1}')

  latex = latex.replace(/$$([^$$]+)$$$$[^)]+$$/g, '$1')

  latex = latex.replace(/\*\*([^*]+)\*\*/g, '\\textbf{$1}')
  latex = latex.replace(/\*([^*\n]+)\*/g, '\\textit{$1}')

  latex = latex.replace(/\\begin\{itemize\}\s*$$leftmargin=\*$$/g, '\\begin{itemize}[leftmargin=*]')
 
  latex = latex.replace(/$$leftmargin=\\text(it|bf)\{[^}]*\}$$/g, '[leftmargin=*]')
  latex = latex.replace(/leftmargin=[^*$$]+$$/g, 'leftmargin=*]')

  latex = latex.replace(/\\large\s+/g, '{\\Large ')
  latex = latex.replace(/\\large([^a-zA-Z])/g, '{\\Large$1')

  latex = latex.replace(/\\section\s*\\text(it|bf)\{([^}]+)\}\{/g, '\\section*{$2}')
  latex = latex.replace(/\\section\}\{/g, '\\section*{')

  latex = latex.replace(/\\\\\s*$$/g, '\\\$$')

  latex = latex.replace(/\\usepackage\{enumerate\}/g, '\\usepackage{enumitem}')

  if (!latex.includes('\\usepackage{enumitem}')) {
    latex = latex.replace(/\\usepackage\{geometry\}/, '\\usepackage{geometry}\n\\usepackage{enumitem}')
  }

  return latex
}

function validateLatex(latex) {
  const errors = []

  // Check components
  if (!latex.includes('\\documentclass')) errors.push('Missing documentclass')
  if (!latex.includes('\\begin{document}')) errors.push('Missing begin document')
  if (!latex.includes('\\end{document}')) errors.push('Missing end document')
  if (!latex.includes('\\usepackage{enumitem}')) errors.push('Missing enumitem package')

  // Check for double braces
  if (latex.match(/\\section\*\{\{/)) errors.push('Double braces in section')

  // Check balanced braces
  const openBraces = (latex.match(/\{/g) || []).length
  const closeBraces = (latex.match(/\}/g) || []).length
  if (openBraces !== closeBraces) errors.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`)

  // Check markdown artifacts
  if (latex.match(/$$[^$$]+$$$$[^)]+$$/)) errors.push('Contains markdown links')
  if (latex.match(/\*\*[^*]+\*\*/)) errors.push('Contains markdown bold')

  // Check itemize structure
  const itemizeMatches = latex.match(/\\begin\{itemize\}/g)
  const endItemizeMatches = latex.match(/\\end\{itemize\}/g)
  if ((itemizeMatches?.length || 0) !== (endItemizeMatches?.length || 0)) {
    errors.push('Unbalanced itemize environments')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

function generateFallbackTemplate(form) {
  const jobs = form.jobs.split('\n').filter(j => j.trim()).map(j => j.trim())
  const projects = form.projects.split('\n').filter(p => p.trim()).map(p => p.trim())

  const jobItems = jobs.map(job => {
    const parts = job.split('|').map(p => p.trim())
    if (parts.length >= 3) {
      const [title, company, dates, ...desc] = parts
      return `\\item \\textbf{${title}} | ${company} | ${dates}${desc.length ? '\\\\' + desc.join(' | ') : ''}`
    }
    return `\\item ${job}`
  }).join('\n')

  const projectItems = projects.map(proj => {
    const parts = proj.split('|').map(p => p.trim())
    if (parts.length >= 2) {
      const [name, tech, ...desc] = parts
      return `\\item \\textbf{${name}} | ${tech}${desc.length ? '\\\\' + desc.join(' | ') : ''}`
    }
    return `\\item ${proj}`
  }).join('\n')

  return `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{enumitem}
\\pagestyle{empty}

\\begin{document}

\\begin{center}
{\\Large \\textbf{${form.name}}}\\\$$0.2cm]
${form.title ? form.title + '\\\$$0.1cm]\n' : ''}${form.email}${form.phone ? ' | ' + form.phone : ''}
\\end{center}

${form.summary ? `\\section*{Summary}\n${form.summary}\n\n` : ''}${jobs.length > 0 ? `\\section*{Experience}
\\begin{itemize}[leftmargin=*]
${jobItems}
\\end{itemize}\n\n` : ''}${projects.length > 0 ? `\\section*{Projects}
\\begin{itemize}[leftmargin=*]
${projectItems}
\\end{itemize}\n\n` : ''}${form.skills ? `\\section*{Skills}\n${form.skills}\n\n` : ''}\\end{document}`
}
