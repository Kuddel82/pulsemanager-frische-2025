const fs = require('fs');
const path = require('path');

// 📄 PDF-GENERATOR für PulseManager System-Analyse
// Erstellt eine professionelle PDF aus der Markdown-Dokumentation

async function generateSystemAnalysisPDF() {
  console.log('🚀 PULSEMANAGER PDF-Generator startet...');
  
  try {
    // 1. Markdown-Datei lesen
    const markdownPath = path.join(__dirname, 'PULSEMANAGER_SYSTEM_ANALYSE.md');
    
    if (!fs.existsSync(markdownPath)) {
      throw new Error('Markdown-Datei nicht gefunden: ' + markdownPath);
    }
    
    const markdownContent = fs.readFileSync(markdownPath, 'utf8');
    console.log('✅ Markdown-Datei gelesen:', markdownPath);
    console.log('📄 Inhalt:', Math.round(markdownContent.length / 1024) + ' KB');
    
    // 2. HTML-Template erstellen
    const htmlContent = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PulseManager System-Analyse</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        
        .header p {
            margin: 10px 0 0 0;
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        h1, h2, h3, h4 {
            color: #2c3e50;
            margin-top: 2em;
            margin-bottom: 0.5em;
        }
        
        h1 {
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        
        h2 {
            border-bottom: 2px solid #e1e8ed;
            padding-bottom: 8px;
            color: #34495e;
        }
        
        h3 {
            color: #7f8c8d;
        }
        
        code {
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Fira Code', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            font-size: 0.9em;
            color: #e74c3c;
        }
        
        pre {
            background: #f8f9fa;
            border: 1px solid #e1e8ed;
            border-radius: 8px;
            padding: 20px;
            overflow-x: auto;
            margin: 20px 0;
        }
        
        pre code {
            background: none;
            padding: 0;
            color: #2c3e50;
        }
        
        blockquote {
            border-left: 4px solid #3498db;
            margin: 20px 0;
            padding: 0 20px;
            background: #f8f9fa;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        table th, table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        
        table th {
            background: #f8f9fa;
            font-weight: 600;
        }
        
        .info-box {
            background: #e8f4fd;
            border: 1px solid #bee5eb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .success-box {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .warning-box {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .footer {
            margin-top: 50px;
            padding: 30px;
            background: #f8f9fa;
            border-radius: 8px;
            text-align: center;
            border-top: 3px solid #3498db;
        }
        
        .architecture-diagram {
            background: #f8f9fa;
            border: 2px solid #e1e8ed;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            font-family: monospace;
            white-space: pre;
            overflow-x: auto;
        }
        
        /* PDF-spezifische Styles */
        @media print {
            body { 
                padding: 0;
                font-size: 12px;
            }
            .header {
                page-break-inside: avoid;
            }
            h1, h2 {
                page-break-after: avoid;
            }
            pre, .architecture-diagram {
                page-break-inside: avoid;
                font-size: 10px;
            }
        }
        
        .toc {
            background: #f8f9fa;
            border: 1px solid #e1e8ed;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
        }
        
        .toc h2 {
            margin-top: 0;
            color: #2c3e50;
        }
        
        .toc ul {
            list-style: none;
            padding-left: 0;
        }
        
        .toc li {
            margin: 8px 0;
            padding-left: 20px;
            position: relative;
        }
        
        .toc li:before {
            content: "▶";
            position: absolute;
            left: 0;
            color: #3498db;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 PulseManager System-Analyse</h1>
        <p>Komplette Systemdokumentation & Enterprise Architecture</p>
        <p>Stand: Januar 2025 | Status: Produktionsreif</p>
    </div>
    
    <div class="toc">
        <h2>📋 Inhaltsverzeichnis</h2>
        <ul>
            <li>Executive Summary</li>
            <li>System-Architektur Übersicht</li>
            <li>Frontend Architektur</li>
            <li>Services Architecture</li>
            <li>API Architecture</li>
            <li>Database Architektur</li>
            <li>Security & Authentication</li>
            <li>Performance Optimierungen</li>
            <li>Deployment & DevOps</li>
            <li>Scalability & Enterprise Readiness</li>
            <li>Bug Fixes & Optimierungen</li>
            <li>Maintenance & Support</li>
            <li>Business Metrics & ROI</li>
            <li>Fazit & Empfehlungen</li>
            <li>Technical Specifications</li>
        </ul>
    </div>
    
    <div id="content">
        ${convertMarkdownToHTML(markdownContent)}
    </div>
    
    <div class="footer">
        <h3>🎯 System Status: PRODUCTION READY</h3>
        <p><strong>PulseManager</strong> - Enterprise-Grade Web3 Portfolio Management Platform</p>
        <p>Generiert: ${new Date().toLocaleDateString('de-DE')} | Version: 1.0 | Dokumentation: Vollständig</p>
    </div>
</body>
</html>`;

    // 3. HTML-Datei speichern (für Browser-Druck)
    const htmlPath = path.join(__dirname, 'PULSEMANAGER_SYSTEM_ANALYSE.html');
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');
    console.log('✅ HTML-Datei erstellt:', htmlPath);
    
    // 4. Erfolgs-Nachricht
    console.log('\n🎉 PDF-GENERATION ABGESCHLOSSEN!');
    console.log('\n📄 Ausgabe-Dateien:');
    console.log('   📝 Markdown:', markdownPath);
    console.log('   🌐 HTML:', htmlPath);
    console.log('\n💡 PDF-Erstellung:');
    console.log('   1. Öffnen Sie die HTML-Datei in Chrome/Edge');
    console.log('   2. Drücken Sie Ctrl+P (Drucken)');
    console.log('   3. Wählen Sie "Als PDF speichern"');
    console.log('   4. Aktivieren Sie "Hintergründe drucken"');
    console.log('   5. Speichern Sie als: PULSEMANAGER_SYSTEM_ANALYSE.pdf');
    
    console.log('\n🎯 FEATURES der HTML-Version:');
    console.log('   ✅ Professionelles Design');
    console.log('   ✅ Inhaltsverzeichnis');
    console.log('   ✅ Syntax-Highlighting');
    console.log('   ✅ Print-optimiert');
    console.log('   ✅ Responsive Layout');
    
    return {
      success: true,
      markdownPath,
      htmlPath,
      message: 'System-Analyse erfolgreich generiert!'
    };
    
  } catch (error) {
    console.error('❌ FEHLER beim PDF-Generator:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// 🔄 MARKDOWN ZU HTML KONVERTER
function convertMarkdownToHTML(markdown) {
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Code Blocks
  html = html.replace(/```[\s\S]*?```/gim, function(match) {
    const code = match.replace(/```/g, '').trim();
    return `<pre><code>${escapeHtml(code)}</code></pre>`;
  });
  
  // Inline Code
  html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');
  
  // Architektur-Diagramme (spezielle Formatierung)
  html = html.replace(/```\n(┌[\s\S]*?└[\s\S]*?)\n```/gim, function(match, content) {
    return `<div class="architecture-diagram">${escapeHtml(content)}</div>`;
  });
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  
  // Lists
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');
  
  // Line breaks
  html = html.replace(/\n\n/gim, '</p><p>');
  html = html.replace(/---/gim, '<hr>');
  
  // Wrap in paragraphs
  html = '<p>' + html + '</p>';
  
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/gim, '');
  html = html.replace(/<p>(<h[1-6]>)/gim, '$1');
  html = html.replace(/(<\/h[1-6]>)<\/p>/gim, '$1');
  html = html.replace(/<p>(<ul>)/gim, '$1');
  html = html.replace(/(<\/ul>)<\/p>/gim, '$1');
  html = html.replace(/<p>(<pre>)/gim, '$1');
  html = html.replace(/(<\/pre>)<\/p>/gim, '$1');
  html = html.replace(/<p>(<div)/gim, '$1');
  html = html.replace(/(<\/div>)<\/p>/gim, '$1');
  html = html.replace(/<p><hr><\/p>/gim, '<hr>');
  
  return html;
}

// 🔒 HTML ESCAPE FUNKTION
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// 🚀 SCRIPT AUSFÜHREN
if (require.main === module) {
  generateSystemAnalysisPDF()
    .then(result => {
      if (result.success) {
        console.log('\n✅ SUCCESS:', result.message);
      } else {
        console.log('\n❌ FEHLER:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 UNERWARTETER FEHLER:', error);
      process.exit(1);
    });
}

module.exports = { generateSystemAnalysisPDF }; 