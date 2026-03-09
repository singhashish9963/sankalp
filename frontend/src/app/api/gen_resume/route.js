import { NextResponse } from 'next/server'

// ============================================
// MAIN API HANDLER
// ============================================
export async function POST(request) {
  const url = new URL(request.url)
  const action = url.searchParams.get('action')

  if (action === 'generate') {
    return handleGenerate(request)
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
}

// ============================================
// GENERATE LATEX WITH LLM
// ============================================
async function handleGenerate(request) {
  try {
    const { form } = await request.json()

    if (!form.name || !form.email) {
      return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
    }

    console.log('🤖 Calling LLM to generate LaTeX...')

    const prompt = buildLatexPrompt(form)

    // Call OpenRouter API
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

    // Clean and fix LaTeX
    latex = cleanLatexCode(latex)
    
    // Validate and test
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

// ============================================
// BUILD PROMPT
// ============================================
function buildLatexPrompt(form) {
  return `Create a LaTeX resume document. Output ONLY the LaTeX code, nothing else.

Use this EXACT template structure:

\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{enumitem}
\\pagestyle{empty}
\\begin{document}
\\begin{center}
{\\Large \\textbf{${form.name}}}\\\\[0.2cm]
${form.title}\\\\[0.1cm]
${form.email}${form.phone ? ' | ' + form.phone : ''}
\\end{center}

\\section*{Summary}
${form.summary}

\\section*{Experience}
\\begin{itemize}[leftmargin=*]
${form.jobs.split('\n').filter(j => j.trim()).map(job => {
  const parts = job.split('|').map(p => p.trim())
  if (parts.length >= 3) {
    return `\\item \\textbf{${parts[0]}} | ${parts[1]} | ${parts[2]}${parts[3] ? '\\\\' + parts[3] : ''}`
  }
  return `\\item ${job}`
}).join('\n')}
\\end{itemize}

\\section*{Projects}
\\begin{itemize}[leftmargin=*]
${form.projects.split('\n').filter(p => p.trim()).map(proj => {
  const parts = proj.split('|').map(p => p.trim())
  if (parts.length >= 2) {
    return `\\item \\textbf{${parts[0]}} | ${parts[1]}${parts[2] ? '\\\\' + parts[2] : ''}`
  }
  return `\\item ${proj}`
}).join('\n')}
\\end{itemize}

\\section*{Skills}
${form.skills}

\\end{document}

CRITICAL RULES:
1. Copy the template EXACTLY as shown above
2. Only replace the data values (name, email, etc.)
3. Keep ALL backslashes exactly as shown
4. Keep ALL braces exactly as shown  
5. Do NOT add extra braces
6. Do NOT use markdown syntax
7. Output ONLY the LaTeX code above with data filled in`
}

// ============================================
// CLEAN LATEX CODE (AGGRESSIVE)
// ============================================
function cleanLatexCode(input) {
  let latex = input

  // Remove code blocks
  latex = latex.replace(/```[\s\S]*?```/g, ''); // Removes entire code blocks
  latex = latex.replace(/```\s*/g, '');         // Fallback for stray triple backticks
  latex = latex.trim();

  // Extract only the LaTeX document
  const docClassIndex = latex.indexOf('\\documentclass')
  if (docClassIndex > 0) {
    latex = latex.substring(docClassIndex)
  }

  const endDocIndex = latex.indexOf('\\end{document}')
  if (endDocIndex > 0) {
    latex = latex.substring(0, endDocIndex + 14)
  }

  // FIX CRITICAL ERRORS

  // 1. Fix double braces in sections: \section*{{Text} -> \section*{Text}
  latex = latex.replace(/\\section\*\{\{([^}]+)\}/g, '\\section*{$1}')
  
  // 2. Fix missing closing braces in sections
  latex = latex.replace(/\\section\*\{([^}]+)$/gm, '\\section*{$1}')

  // 3. Remove markdown links
  latex = latex.replace(/$$([^$$]+)$$$$[^)]+$$/g, '$1')

  // 4. Fix markdown bold to LaTeX
  latex = latex.replace(/\*\*([^*]+)\*\*/g, '\\textbf{$1}')
  latex = latex.replace(/\*([^*\n]+)\*/g, '\\textit{$1}')

  // 5. Fix malformed itemize - ensure it's on its own line
  latex = latex.replace(/\\begin\{itemize\}\s*$$leftmargin=\*$$/g, '\\begin{itemize}[leftmargin=*]')
  
  // 6. Fix leftmargin parameter corruption
  latex = latex.replace(/$$leftmargin=\\text(it|bf)\{[^}]*\}$$/g, '[leftmargin=*]')
  latex = latex.replace(/leftmargin=[^*$$]+$$/g, 'leftmargin=*]')

  // 7. Fix \large to \Large
  latex = latex.replace(/\\large\s+/g, '{\\Large ')
  latex = latex.replace(/\\large([^a-zA-Z])/g, '{\\Large$1')

  // 8. Fix broken section commands
  latex = latex.replace(/\\section\s*\\text(it|bf)\{([^}]+)\}\{/g, '\\section*{$2}')
  latex = latex.replace(/\\section\}\{/g, '\\section*{')

  // 9. Ensure proper spacing after \\
  latex = latex.replace(/\\\\\s*$$/g, '\\\$$')

  // 10. Fix enumerate package issues
  latex = latex.replace(/\\usepackage\{enumerate\}/g, '\\usepackage{enumitem}')

  // Ensure required structure
  if (!latex.includes('\\usepackage{enumitem}')) {
    latex = latex.replace(/\\usepackage\{geometry\}/, '\\usepackage{geometry}\n\\usepackage{enumitem}')
  }

  return latex
}

// ============================================
// VALIDATE LATEX
// ============================================
function validateLatex(latex) {
  const errors = []

  // Check required components
  if (!latex.includes('\\documentclass')) errors.push('Missing documentclass')
  if (!latex.includes('\\begin{document}')) errors.push('Missing begin document')
  if (!latex.includes('\\end{document}')) errors.push('Missing end document')
  if (!latex.includes('\\usepackage{enumitem}')) errors.push('Missing enumitem package')

  // Check for double braces in sections
  if (latex.match(/\\section\*\{\{/)) errors.push('Double braces in section')

  // Check balanced braces
  const openBraces = (latex.match(/\{/g) || []).length
  const closeBraces = (latex.match(/\}/g) || []).length
  if (openBraces !== closeBraces) errors.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`)

  // Check for markdown artifacts
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

// ============================================
// FALLBACK TEMPLATE (100% RELIABLE)
// ============================================
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
