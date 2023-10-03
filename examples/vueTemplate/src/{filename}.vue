${--
	variables.className = outputPathRelative.split('.').slice(0, -1).join('.').split('/').join('-').toLowerCase()
--}<template>
	<section class="${{ variables.className }}"></section>
</template>

<script lang="ts">
	import { beforeDestroy, mounted } from '@/Utility/Decorators';
	import { Component } from 'vue-property-decorator';
	import ViewBase from '@/View/Base.vue';

	/**
	 * @author ${package.author}
	 * @package ${{ outputDirectoryRelative }}
	 * @project ${package.name}
	 * @version ${package.version}
	 */
	@Component
	export default class ${{
		outputPathRelative
			.split('.')
			.slice(0, -1)
			.join('.')
			.split('/')
			.map(str => str.charAt(0).toUpperCase() + str.slice(1))
			.join('')
	}} extends ViewBase {
		// Not implemented
	}
</script>

<style lang="scss">
	.${{ variables.className }} {
		// Not implemented
	}
</style>
