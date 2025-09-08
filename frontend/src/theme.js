// src/theme.js
import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  // Custom colors from your CSS variables
  colors: {
    primary: {
      500: "#FF8F00", // --ui-orange
    },
    secondary: {
      500: "#00796B", // --ui-turquoise
    },
    background: {
      500: "#FAFAFA", // --ui-white
    },
    dark: {
      500: "#333", // --ui-dark
    },
    // Using a new shade of gray to match your variable
    gray: {
      500: "#6c757d", // --ui-gray
      // You can add other shades if you want, e.g., 600: "#555",
    },
  },

  // Custom design tokens for shadows and transitions
  shadows: {
    light: "0 4px 12px rgba(0,0,0,0.08)", // --box-shadow-light
  },
  
  // Custom transition token. This can be used with the `transition` prop.
  // Note: Chakra's default theme already has 'slow', 'medium', 'fast'
  // but you can define a custom one like this.
  transitions: {
    speed: "0.3s", // --transition-speed
  },

  // You can also add more global styles here if needed.
  // Example: Setting a default font-family
  // styles: {
  //   global: {
  //     body: {
  //       fontFamily: 'system-ui, sans-serif',
  //     },
  //   },
  // },
});

export default theme;