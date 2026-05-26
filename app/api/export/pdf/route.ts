import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePro } from '@/lib/billing'
import { exportAppSchema, exportRequestSchema } from '@/lib/schemas'

type ExportApp = z.infer<typeof exportAppSchema>

export async function POST(request: NextRequest) {
  try {
    const proAccess = await requirePro()

    if (!proAccess.ok) {
      return proAccess.response
    }

    const parsedBody = exportRequestSchema.safeParse(await request.json())

    if (!parsedBody.success) {
      return NextResponse.json({ error: parsedBody.error.issues[0]?.message ?? 'Invalid export request' }, { status: 400 })
    }

    const { app } = parsedBody.data
    const fileBaseName = toSlug(app.app_name)

    // Generate HTML content for PDF
    const htmlContent = generateHTML(app)

    // Use a PDF generation service (we'll use a simple approach for now)
    // In production, use jsPDF or similar library
    const pdfContent = generatePDFContent(htmlContent)

    return new NextResponse(pdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileBaseName}-report.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'report'
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function generateHTML(app: ExportApp): string {
  const appName = escapeHtml(app.app_name)
  const appType = escapeHtml(app.app_type)
  const description = escapeHtml(app.description)
  const difficultyLevel = escapeHtml(app.difficulty_level)
  const explanation = escapeHtml(app.ai_explanation)
  const technologies = app.technologies.map((tech) => `<span class="badge">${escapeHtml(tech)}</span>`).join('')
  const missingFiles = app.missing_files.map((file) => `<li>${escapeHtml(file)}</li>`).join('')

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          h1 { color: #000; border-bottom: 3px solid #000; padding-bottom: 10px; }
          h2 { color: #555; margin-top: 20px; }
          .section { margin: 20px 0; }
          .badge { display: inline-block; padding: 5px 10px; background: #f0f0f0; border-radius: 4px; margin: 5px 5px 5px 0; font-size: 12px; }
          .complete { background: #d4edda; color: #155724; }
          .partial { background: #fff3cd; color: #856404; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #f5f5f5; }
          ul { margin: 10px 0; padding-left: 20px; }
          li { margin: 5px 0; }
        </style>
      </head>
      <body>
        <h1>${appName}</h1>
        
        <div class="section">
          <h2>Overview</h2>
          <p><strong>Type:</strong> ${appType}</p>
          <p><strong>Description:</strong> ${description}</p>
          <p><strong>Status:</strong> <span class="badge ${app.is_complete ? 'complete' : 'partial'}">${app.is_complete ? 'Complete' : 'Partial'}</span></p>
        </div>

        <div class="section">
          <h2>Key Metrics</h2>
          <table>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
            <tr>
              <td>Reusable Code</td>
              <td>${app.reuse_percentage}%</td>
            </tr>
            <tr>
              <td>Difficulty Level</td>
              <td>${difficultyLevel}</td>
            </tr>
            <tr>
              <td>Missing Files</td>
              <td>${app.missing_files_count}</td>
            </tr>
          </table>
        </div>

        ${app.technologies.length > 0 ? `
          <div class="section">
            <h2>Technologies</h2>
            <div>${technologies}</div>
          </div>
        ` : ''}

        ${app.missing_files.length > 0 ? `
          <div class="section">
            <h2>Missing Files</h2>
            <ul>
              ${missingFiles}
            </ul>
          </div>
        ` : ''}

        <div class="section">
          <h2>Analysis & Explanation</h2>
          <p>${explanation}</p>
        </div>

        <div class="section">
          <h2>Getting Started</h2>
          <ol>
            <li>Create a new repository</li>
            <li>Clone the reusable files from identified source repositories</li>
            <li>Install all dependencies</li>
            <li>Add ${app.missing_files_count} missing files</li>
            <li>Test thoroughly</li>
            <li>Deploy to production</li>
          </ol>
        </div>

        <p style="margin-top: 40px; color: #999; font-size: 12px;">
          Generated by RepoFuse on ${new Date().toLocaleDateString()}
        </p>
      </body>
    </html>
  `
}

function generatePDFContent(html: string): Buffer {
  // For production, use a proper PDF library like jsPDF or pdfkit
  // For now, return a simple text representation
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

  return Buffer.from(text, 'utf-8')
}
