import { GoogleGenAI } from "@google/genai";
import { AnalysisOptions } from "../types";

const SYSTEM_INSTRUCTION = `
你是一个专业的图片信息提取专家。
你的任务是：
1. 接收用户提供的图片
2. 识别图片类型和主题
3. 提取图片中所有可见的视觉信息（极高细节密度）
4. 根据图片类型选择合适的 JSON 结构模板
5. 将提取的信息填充到 JSON 结构中，每个字段都要详尽描述
6. 输出纯净的 JSON 格式，不带任何解释说明

强约束：
- 必须输出纯净的 JSON 格式
- JSON 必须符合语法规范（可被解析）
- 字段名称使用英文（如 subject、environment）
- 字段内容使用用户指定语言（默认中文）
- 不输出任何解释性文字
- 不输出分析过程
- 不输出前言后语
- 不输出json标记，直接输出 JSON

细节密度要求：
- 人物肖像：每个主要字段至少 20-50 字
- 产品广告：产品描述至少 50-100 字
- 海报设计：整体描述至少 200-400 字
- 风景照片：环境描述至少 100-200 字
- 插画艺术：风格描述至少 50-100 字
`;

export async function analyzeImage(file: File, options: AnalysisOptions): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = "gemini-3.1-pro-preview";

  const base64Data = await fileToBase64(file);
  const [mimeType, data] = base64Data.split(',');

  const prompt = `
图片类型提示：${options.typeHint}
提取重点：${options.focus || '全面提取'}
输出语言：${options.language}

请根据图片内容，选择最合适的模板（人物肖像/产品广告/海报设计/风景照片/插画艺术）进行极高细节密度的信息提取，并以 JSON 格式输出。
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: file.type,
                data: data
              }
            }
          ]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
