/// <reference types="astro/client" />

/**
 * Объявление виртуального модуля astro-icon/components.
 * Модуль регистрируется интеграцией shirones через astro-icon в рантайме;
 * TypeScript его не видит статически — объявляем вручную.
 */
declare module "astro-icon/components" {
	import type { HTMLAttributes } from "astro/types";
	export interface IconProps extends HTMLAttributes<"svg"> {
		name: string;
		title?: string;
		size?: number | string;
	}
	export const Icon: (props: IconProps) => any;
}

/**
 * Объявление модуля @iconify/svelte для Svelte 5.
 * Устраняет ошибку ts(2307) в IDE при импорте Icon в .svelte компонентах.
 */
declare module "@iconify/svelte" {
	import type { Component } from "svelte";
	export interface IconProps {
		icon: string | object;
		inline?: boolean;
		width?: string | number;
		height?: string | number;
		style?: string;
		color?: string;
		ssr?: boolean;
		class?: string;
		[key: string]: any;
	}
	const Icon: Component<IconProps>;
	export default Icon;
}

/**
 * Объявление модулей .svelte компонентов.
 * Устраняет ошибку ts(2307) в IDE при импорте .svelte файлов из темы и проекта.
 */
declare module "*.svelte" {
	import type { Component } from "svelte";
	const component: Component<any, any, any>;
	export default component;
}
