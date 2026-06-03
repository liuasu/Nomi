import type { GenerationCanvasNode, GenerationNodeResult, TiptapDocJson } from '../model/generationCanvasTypes'
import { useGenerationCanvasStore } from '../store/generationCanvasStore'
import { markdownToTiptapContent } from '../../creation/markdownToTiptap'
import { runCatalogGenerationTask, type CatalogTaskActionOptions } from './catalogTaskActions'

export type GenerateTextOptions = CatalogTaskActionOptions

/**
 * C5: 文本节点生成。
 *
 * 「续写不覆盖」在**数据层**实现：拿到模型文本后，读节点**最新** contentJson，
 * 把新文本转成 Tiptap 段落 append 到文档末尾再整体写回——不依赖 editor 实例
 * （生成时编辑器可能未挂载/节点未选中）。复用 markdownToTiptapContent，与编辑器
 * 内核 useNomiRichTextEditor.appendToEnd 同一套 markdown→tiptap 转换，避免两套实现。
 *
 * 返回的 GenerationNodeResult（type:'text'）由 runner 记进 node.result / history 作摘要；
 * 因为它没有 url，composer 的 hasResult 恒 false → 按钮永远是「生成 →」、每次都续写。
 */
export async function generateText(
  node: GenerationCanvasNode,
  options: GenerateTextOptions = {},
): Promise<GenerationNodeResult> {
  const result = await runCatalogGenerationTask(node, options)
  const text = (result.text || '').trim()
  if (text) appendTextToNodeDocument(node.id, text)
  return result
}

/** 读节点最新 contentJson，append 新文本段落后整体写回（持久化）。 */
function appendTextToNodeDocument(nodeId: string, text: string): void {
  const state = useGenerationCanvasStore.getState()
  const current = state.nodes.find((candidate) => candidate.id === nodeId)
  if (!current) return
  const existing = Array.isArray(current.contentJson?.content) ? current.contentJson!.content : []
  const appended = markdownToTiptapContent(text)
  if (!appended.length) return
  const nextDoc: TiptapDocJson = {
    type: 'doc',
    content: [...existing, ...appended],
  }
  state.updateNode(nodeId, { contentJson: nextDoc })
}
