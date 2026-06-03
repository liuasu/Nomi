import { describe, expect, it } from 'vitest'
import { normalizeCatalogTaskResult } from './catalogTaskActions'
import type { GenerationCanvasNode } from '../model/generationCanvasTypes'
import type { TaskResultDto } from '../../api/taskApi'

function textNode(): GenerationCanvasNode {
  return { id: 'n1', kind: 'text', title: '', position: { x: 0, y: 0 }, meta: { modelKey: 'gpt-x' } }
}

function imageNode(): GenerationCanvasNode {
  return { id: 'n2', kind: 'image', title: '', position: { x: 0, y: 0 }, meta: { modelKey: 'sd' } }
}

function chatResult(raw: unknown, status: TaskResultDto['status'] = 'succeeded'): TaskResultDto {
  return { id: 'task-1', kind: 'chat', status, assets: [], raw }
}

describe('normalizeCatalogTaskResult — C5 text branch', () => {
  it('extracts OpenAI choices[0].message.content', () => {
    const result = normalizeCatalogTaskResult(chatResult({ choices: [{ message: { content: '  你好世界  ' } }] }), textNode())
    expect(result.type).toBe('text')
    expect(result.text).toBe('你好世界')
    expect(result.url).toBeUndefined()
    expect(result.taskKind).toBe('text')
    expect(result.model).toBe('gpt-x')
  })

  it('extracts OpenAI message.content as array of parts', () => {
    const result = normalizeCatalogTaskResult(
      chatResult({ choices: [{ message: { content: [{ type: 'text', text: 'foo' }, { type: 'text', text: 'bar' }] } }] }),
      textNode(),
    )
    expect(result.text).toBe('foobar')
  })

  it('falls back to Anthropic-style content[].text', () => {
    const result = normalizeCatalogTaskResult(chatResult({ content: [{ type: 'text', text: 'claude says hi' }] }), textNode())
    expect(result.text).toBe('claude says hi')
  })

  it('throws when the chat response carries no text', () => {
    expect(() => normalizeCatalogTaskResult(chatResult({ choices: [{ message: { content: '' } }] }), textNode())).toThrow(
      /没有返回文本/,
    )
  })

  it('throws on a failed text task', () => {
    expect(() => normalizeCatalogTaskResult(chatResult({ error: 'boom' }, 'failed'), textNode())).toThrow()
  })
})

describe('normalizeCatalogTaskResult — image path unaffected', () => {
  it('still returns an image result from an asset', () => {
    const result = normalizeCatalogTaskResult(
      { id: 't2', kind: 'text_to_image', status: 'succeeded', assets: [{ type: 'image', url: 'https://x/y.png' }], raw: {} },
      imageNode(),
    )
    expect(result.type).toBe('image')
    expect(result.url).toBe('https://x/y.png')
  })
})
