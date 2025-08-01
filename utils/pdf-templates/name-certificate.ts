// PDF模板生成函数
interface NameData {
  chinese: string;
  pinyin: string;
  characters: Array<{
    character: string;
    pinyin: string;
    meaning: string;
    explanation: string;
  }>;
  meaning: string;
  culturalNotes: string;
  personalityMatch: string;
  style: string;
}

interface UserData {
  englishName: string;
  gender: string;
}

export function generateCertificateHTML(nameData: NameData, userData: UserData): string {
  const currentDate = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>中文名字证书 - ${nameData.chinese}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700;900&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Noto Serif SC', 'SimSun', serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .certificate {
            background: white;
            width: 210mm;
            min-height: 297mm;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            position: relative;
            overflow: hidden;
        }
        
        .border-decoration {
            position: absolute;
            top: 15mm;
            left: 15mm;
            right: 15mm;
            bottom: 15mm;
            border: 3px solid #c41e3a;
            border-radius: 8px;
        }
        
        .corner-decoration {
            position: absolute;
            width: 20mm;
            height: 20mm;
            border: 2px solid #c41e3a;
        }
        
        .corner-decoration.top-left {
            top: 10mm;
            left: 10mm;
            border-right: none;
            border-bottom: none;
        }
        
        .corner-decoration.top-right {
            top: 10mm;
            right: 10mm;
            border-left: none;
            border-bottom: none;
        }
        
        .corner-decoration.bottom-left {
            bottom: 10mm;
            left: 10mm;
            border-right: none;
            border-top: none;
        }
        
        .corner-decoration.bottom-right {
            bottom: 10mm;
            right: 10mm;
            border-left: none;
            border-top: none;
        }
        
        .content {
            padding: 25mm;
            position: relative;
            z-index: 1;
            text-align: center;
        }
        
        .header {
            margin-bottom: 20mm;
        }
        
        .title {
            font-size: 32px;
            font-weight: 900;
            color: #c41e3a;
            margin-bottom: 10px;
            letter-spacing: 3px;
        }
        
        .subtitle {
            font-size: 18px;
            color: #666;
            font-weight: 400;
        }
        
        .main-section {
            margin-bottom: 15mm;
            background: rgba(196, 30, 58, 0.02);
            padding: 15mm;
            border-radius: 8px;
            border-left: 4px solid #c41e3a;
        }
        
        .english-name {
            font-size: 24px;
            color: #333;
            margin-bottom: 15px;
            font-weight: 700;
        }
        
        .chinese-name {
            font-size: 72px;
            font-weight: 900;
            color: #c41e3a;
            margin: 20px 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
            line-height: 1.2;
        }
        
        .pinyin {
            font-size: 28px;
            color: #666;
            margin-bottom: 20px;
            letter-spacing: 2px;
        }
        
        .section {
            margin-bottom: 12mm;
            text-align: left;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: 700;
            color: #c41e3a;
            margin-bottom: 8px;
            border-bottom: 2px solid #c41e3a;
            padding-bottom: 4px;
            display: inline-block;
        }
        
        .section-content {
            font-size: 16px;
            line-height: 1.8;
            color: #333;
            text-align: justify;
        }
        
        .characters-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 15px 0;
        }
        
        .character-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .character {
            font-size: 48px;
            font-weight: 900;
            color: #c41e3a;
            margin-bottom: 8px;
        }
        
        .character-pinyin {
            font-size: 16px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .character-meaning {
            font-size: 14px;
            font-weight: 700;
            color: #333;
            margin-bottom: 8px;
        }
        
        .character-explanation {
            font-size: 12px;
            color: #666;
            line-height: 1.4;
        }
        
        .footer {
            margin-top: 20mm;
            text-align: center;
            border-top: 1px solid #ddd;
            padding-top: 15px;
        }
        
        .date {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }
        
        .brand {
            font-size: 12px;
            color: #999;
        }
        
        .seal {
            position: absolute;
            bottom: 25mm;
            right: 25mm;
            width: 60px;
            height: 60px;
            border: 3px solid #c41e3a;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: #c41e3a;
            font-weight: 700;
            transform: rotate(-15deg);
            background: rgba(196, 30, 58, 0.05);
        }
        
        @media print {
            body {
                background: white;
            }
            .certificate {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="certificate">
        <!-- 装饰边框 -->
        <div class="border-decoration"></div>
        <div class="corner-decoration top-left"></div>
        <div class="corner-decoration top-right"></div>
        <div class="corner-decoration bottom-left"></div>
        <div class="corner-decoration bottom-right"></div>
        
        <!-- 印章 -->
        <div class="seal">官方<br>认证</div>
        
        <div class="content">
            <!-- 头部 -->
            <div class="header">
                <h1 class="title">中文名字证书</h1>
                <p class="subtitle">Chinese Name Certificate</p>
            </div>
            
            <!-- 主要信息 -->
            <div class="main-section">
                <div class="english-name">English Name: ${userData.englishName}</div>
                <div class="chinese-name">${nameData.chinese}</div>
                <div class="pinyin">${nameData.pinyin}</div>
            </div>
            
            <!-- 字符分解 -->
            <div class="section">
                <h2 class="section-title">字符详解 Character Analysis</h2>
                <div class="characters-grid">
                    ${nameData.characters.map(char => `
                        <div class="character-item">
                            <div class="character">${char.character}</div>
                            <div class="character-pinyin">${char.pinyin}</div>
                            <div class="character-meaning">${char.meaning}</div>
                            <div class="character-explanation">${char.explanation}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- 整体含义 -->
            <div class="section">
                <h2 class="section-title">整体含义 Overall Meaning</h2>
                <p class="section-content">${nameData.meaning}</p>
            </div>
            
            <!-- 文化背景 -->
            <div class="section">
                <h2 class="section-title">文化背景 Cultural Context</h2>
                <p class="section-content">${nameData.culturalNotes}</p>
            </div>
            
            <!-- 个性匹配 -->
            <div class="section">
                <h2 class="section-title">个性匹配 Personality Match</h2>
                <p class="section-content">${nameData.personalityMatch}</p>
            </div>
            
            <!-- 底部信息 -->
            <div class="footer">
                <div class="date">生成日期：${currentDate}</div>
                <div class="brand">由 AI 中文名字生成器 专业生成</div>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}