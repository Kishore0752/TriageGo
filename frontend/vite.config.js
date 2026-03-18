import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // This maps 'react-native' imports to 'react-native-web'
      'react-native': 'react-native-web',
    },
  },
})