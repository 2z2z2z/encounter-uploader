import { computed, defineComponent, h, type PropType } from 'vue'
import { sanitizeHtml } from '@/utils/sanitizeHtml'

export default defineComponent({
  name: 'SafeHtmlDisplay',
  props: {
    content: {
      type: String,
      default: ''
    },
    tag: {
      type: String as PropType<keyof globalThis.HTMLElementTagNameMap>,
      default: 'div'
    },
    allowStyles: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { attrs }) {
    const sanitized = computed(() =>
      sanitizeHtml(props.content, { allowStyles: props.allowStyles })
    )

    return () =>
      h(
        props.tag,
        {
          ...attrs,
          innerHTML: sanitized.value
        }
      )
  }
})
