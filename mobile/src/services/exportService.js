import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import { supabaseService } from './supabaseClient';

export class ExportService {
  
  // Export dreams to JSON format
  async exportToJSON(dreams, dateRange = null) {
    try {
      let filteredDreams = dreams;
      
      if (dateRange) {
        filteredDreams = dreams.filter(dream => {
          const dreamDate = new Date(dream.entry_date || dream.created_at);
          return dreamDate >= dateRange.start && dreamDate <= dateRange.end;
        });
      }

      const exportData = {
        export_date: new Date().toISOString(),
        total_dreams: filteredDreams.length,
        date_range: dateRange ? {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString()
        } : null,
        dreams: filteredDreams.map(dream => ({
          id: dream.id,
          title: dream.dream_title,
          description: dream.enhanced_description,
          date: dream.entry_date || dream.created_at?.split('T')[0],
          emotions: dream.emotions || [],
          themes: dream.themes || [],
          symbols: dream.symbols || [],
          lucidity_level: dream.lucidity_level || 0,
          vividness_level: dream.vividness_level || 0,
          art_style: dream.art_style,
          has_image: !!dream.image_url,
          created_at: dream.created_at
        }))
      };

      const fileName = `dreamweave_export_${new Date().getTime()}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(exportData, null, 2),
        { encoding: FileSystem.EncodingType.UTF8 }
      );

      return fileUri;
    } catch (error) {
      console.error('Export to JSON failed:', error);
      throw new Error('Failed to export dreams to JSON');
    }
  }

  // Export dreams to CSV format
  async exportToCSV(dreams, dateRange = null) {
    try {
      let filteredDreams = dreams;
      
      if (dateRange) {
        filteredDreams = dreams.filter(dream => {
          const dreamDate = new Date(dream.entry_date || dream.created_at);
          return dreamDate >= dateRange.start && dreamDate <= dateRange.end;
        });
      }

      const headers = [
        'Date',
        'Title',
        'Description',
        'Emotions',
        'Themes',
        'Symbols',
        'Lucidity Level',
        'Vividness Level',
        'Art Style',
        'Has Image'
      ];

      const csvRows = [headers.join(',')];

      filteredDreams.forEach(dream => {
        const row = [
          `"${dream.entry_date || dream.created_at?.split('T')[0] || ''}"`,
          `"${(dream.dream_title || '').replace(/"/g, '""')}"`,
          `"${(dream.enhanced_description || '').replace(/"/g, '""')}"`,
          `"${(dream.emotions || []).join('; ')}"`,
          `"${(dream.themes || []).join('; ')}"`,
          `"${(dream.symbols || []).join('; ')}"`,
          dream.lucidity_level || 0,
          dream.vividness_level || 0,
          `"${dream.art_style || ''}"`,
          dream.image_url ? 'Yes' : 'No'
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const fileName = `dreamweave_export_${new Date().getTime()}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(
        fileUri,
        csvContent,
        { encoding: FileSystem.EncodingType.UTF8 }
      );

      return fileUri;
    } catch (error) {
      console.error('Export to CSV failed:', error);
      throw new Error('Failed to export dreams to CSV');
    }
  }

  // Export dreams to HTML format (printable)
  async exportToHTML(dreams, dateRange = null) {
    try {
      let filteredDreams = dreams;
      
      if (dateRange) {
        filteredDreams = dreams.filter(dream => {
          const dreamDate = new Date(dream.entry_date || dream.created_at);
          return dreamDate >= dateRange.start && dreamDate <= dateRange.end;
        });
      }

      const htmlContent = this.generateHTMLContent(filteredDreams, dateRange);
      const fileName = `dreamweave_journal_${new Date().getTime()}.html`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(
        fileUri,
        htmlContent,
        { encoding: FileSystem.EncodingType.UTF8 }
      );

      return fileUri;
    } catch (error) {
      console.error('Export to HTML failed:', error);
      throw new Error('Failed to export dreams to HTML');
    }
  }

  // Generate dream statistics report
  async generateStatisticsReport(dreams) {
    try {
      const stats = this.calculateStatistics(dreams);
      const reportContent = this.generateStatsHTML(stats);
      
      const fileName = `dreamweave_statistics_${new Date().getTime()}.html`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(
        fileUri,
        reportContent,
        { encoding: FileSystem.EncodingType.UTF8 }
      );

      return fileUri;
    } catch (error) {
      console.error('Statistics report generation failed:', error);
      throw new Error('Failed to generate statistics report');
    }
  }

  // Share exported file
  async shareFile(fileUri, title = 'DreamWeave Export') {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: this.getMimeType(fileUri),
        dialogTitle: title
      });
    } catch (error) {
      console.error('Sharing failed:', error);
      throw new Error('Failed to share file');
    }
  }

  // Import dreams from JSON file
  async importFromJSON() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true
      });

      if (result.type === 'cancel') {
        return null;
      }

      const fileContent = await FileSystem.readAsStringAsync(result.uri);
      const importData = JSON.parse(fileContent);

      if (!importData.dreams || !Array.isArray(importData.dreams)) {
        throw new Error('Invalid file format');
      }

      return {
        dreams: importData.dreams,
        metadata: {
          total_dreams: importData.total_dreams,
          export_date: importData.export_date,
          date_range: importData.date_range
        }
      };
    } catch (error) {
      console.error('Import failed:', error);
      throw new Error('Failed to import dreams file');
    }
  }

  // Create archive in Supabase
  async createArchive(userId, archiveName, dateRange, format) {
    try {
      if (!supabaseService.isConfigured()) {
        throw new Error('Archive feature requires online connection');
      }

      const archiveData = {
        user_id: userId,
        archive_name: archiveName,
        date_range_start: dateRange.start.toISOString().split('T')[0],
        date_range_end: dateRange.end.toISOString().split('T')[0],
        archive_format: format
      };

      return await supabaseService.createDreamArchive(archiveData);
    } catch (error) {
      console.error('Archive creation failed:', error);
      throw error;
    }
  }

  // Helper methods
  generateHTMLContent(dreams, dateRange) {
    const dateRangeText = dateRange 
      ? `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`
      : 'All Dreams';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>DreamWeave Journal Export</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .header { 
            text-align: center; 
            border-bottom: 2px solid #7b2cbf; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
        }
        .dream-entry { 
            margin-bottom: 40px; 
            padding: 20px; 
            border-radius: 12px;
            background: #f9fafb;
            border-left: 4px solid #7b2cbf;
        }
        .dream-title { 
            font-size: 20px; 
            font-weight: bold; 
            color: #1a1b3a;
            margin-bottom: 8px;
        }
        .dream-date { 
            color: #6b7280; 
            font-size: 14px;
            margin-bottom: 16px;
        }
        .dream-description { 
            margin-bottom: 16px;
            font-size: 16px;
        }
        .dream-tags { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 8px;
            margin-top: 12px;
        }
        .tag { 
            background: #ede9fe; 
            color: #7b2cbf; 
            padding: 4px 12px; 
            border-radius: 12px; 
            font-size: 12px;
        }
        .stats { 
            background: #f3f4f6; 
            padding: 16px; 
            border-radius: 8px;
            margin-bottom: 20px;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            .dream-entry { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌙 DreamWeave Journal</h1>
        <p>Exported on ${new Date().toLocaleDateString()}</p>
        <p>Period: ${dateRangeText}</p>
        <div class="stats">
            <strong>Total Dreams: ${dreams.length}</strong>
        </div>
    </div>
    
    ${dreams.map(dream => `
        <div class="dream-entry">
            <div class="dream-title">${dream.dream_title || 'Untitled Dream'}</div>
            <div class="dream-date">${new Date(dream.entry_date || dream.created_at).toLocaleDateString()}</div>
            <div class="dream-description">${dream.enhanced_description || ''}</div>
            
            ${dream.emotions?.length > 0 || dream.themes?.length > 0 ? `
                <div class="dream-tags">
                    ${(dream.emotions || []).map(emotion => `<span class="tag">💭 ${emotion}</span>`).join('')}
                    ${(dream.themes || []).map(theme => `<span class="tag">🎭 ${theme}</span>`).join('')}
                    ${dream.lucidity_level > 0 ? `<span class="tag">✨ Lucidity: ${dream.lucidity_level}/5</span>` : ''}
                </div>
            ` : ''}
        </div>
    `).join('')}
    
    <div style="text-align: center; margin-top: 40px; color: #6b7280; font-size: 14px;">
        Generated by DreamWeave - AI-Powered Dream Journal
    </div>
</body>
</html>`;
  }

  calculateStatistics(dreams) {
    const totalDreams = dreams.length;
    if (totalDreams === 0) return null;

    const emotions = [];
    const themes = [];
    const symbols = [];
    let totalLucidity = 0;
    let totalVividness = 0;
    let lucidityCount = 0;
    let vividnessCount = 0;

    dreams.forEach(dream => {
      if (dream.emotions) emotions.push(...dream.emotions);
      if (dream.themes) themes.push(...dream.themes);
      if (dream.symbols) symbols.push(...dream.symbols);
      
      if (dream.lucidity_level > 0) {
        totalLucidity += dream.lucidity_level;
        lucidityCount++;
      }
      
      if (dream.vividness_level > 0) {
        totalVividness += dream.vividness_level;
        vividnessCount++;
      }
    });

    const countOccurrences = (arr) => {
      const counts = {};
      arr.forEach(item => counts[item] = (counts[item] || 0) + 1);
      return Object.entries(counts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
    };

    return {
      totalDreams,
      averageLucidity: lucidityCount > 0 ? (totalLucidity / lucidityCount).toFixed(1) : 0,
      averageVividness: vividnessCount > 0 ? (totalVividness / vividnessCount).toFixed(1) : 0,
      topEmotions: countOccurrences(emotions),
      topThemes: countOccurrences(themes),
      topSymbols: countOccurrences(symbols),
      dreamsWithImages: dreams.filter(d => d.image_url).length
    };
  }

  generateStatsHTML(stats) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>DreamWeave Statistics Report</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            color: #333;
        }
        .header { text-align: center; margin-bottom: 40px; }
        .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .stat-card { background: #f9fafb; padding: 20px; border-radius: 12px; text-align: center; }
        .stat-number { font-size: 36px; font-weight: bold; color: #7b2cbf; }
        .stat-label { color: #6b7280; margin-top: 8px; }
        .top-list { background: white; padding: 20px; border-radius: 12px; margin: 20px 0; }
        .list-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Dream Statistics</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="stat-grid">
        <div class="stat-card">
            <div class="stat-number">${stats.totalDreams}</div>
            <div class="stat-label">Total Dreams</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.averageLucidity}</div>
            <div class="stat-label">Avg Lucidity</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.averageVividness}</div>
            <div class="stat-label">Avg Vividness</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.dreamsWithImages}</div>
            <div class="stat-label">Dreams with AI Art</div>
        </div>
    </div>
    
    <div class="top-list">
        <h3>Top Emotions</h3>
        ${stats.topEmotions.map(([emotion, count]) => 
          `<div class="list-item"><span>${emotion}</span><span>${count}</span></div>`
        ).join('')}
    </div>
    
    <div class="top-list">
        <h3>Top Themes</h3>
        ${stats.topThemes.map(([theme, count]) => 
          `<div class="list-item"><span>${theme}</span><span>${count}</span></div>`
        ).join('')}
    </div>
</body>
</html>`;
  }

  getMimeType(fileUri) {
    const extension = fileUri.split('.').pop().toLowerCase();
    switch (extension) {
      case 'json': return 'application/json';
      case 'csv': return 'text/csv';
      case 'html': return 'text/html';
      default: return 'application/octet-stream';
    }
  }
}

export const exportService = new ExportService();