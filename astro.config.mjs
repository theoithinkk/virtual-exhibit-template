import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import icon from 'astro-icon';

export default defineConfig({
  integrations: [react(), mdx(), tailwind(), icon()],
  site: 'https://your-org.github.io',
  base: '/silicon-minds/',
});
