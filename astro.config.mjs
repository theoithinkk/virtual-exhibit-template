import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import icon from 'astro-icon';

export default defineConfig({
  integrations: [react(), mdx(), tailwind({ applyBaseStyles: false }), icon()],
  site: 'https://theoithinkk.github.io',
  base: '/csarchTestRepo/',
});
