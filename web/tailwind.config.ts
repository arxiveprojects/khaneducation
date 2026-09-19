import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				display: ['Fraunces', 'Georgia', 'serif'],
				sans: ['"Atkinson Hyperlegible"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					hover: 'hsl(var(--primary-hover))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				info: {
					DEFAULT: 'hsl(var(--info))',
					foreground: 'hsl(var(--info-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-secondary': 'var(--gradient-secondary)',
				'gradient-hero': 'var(--gradient-hero)'
			},
			boxShadow: {
				'soft': 'var(--shadow-soft)',
				'medium': 'var(--shadow-medium)',
				'large': 'var(--shadow-large)',
				'glow': 'var(--shadow-glow)',
				'elevated': 'var(--shadow-elevated)',
				'floating': 'var(--shadow-floating)',
				'inset': 'var(--shadow-inset)'
			},
			backdropBlur: {
				'glass': 'var(--blur-backdrop)',
				'subtle': 'var(--blur-subtle)',
				'medium': 'var(--blur-medium)'
			},
			backgroundColor: {
				'surface-base': 'var(--surface-base)',
				'surface-elevated': 'var(--surface-elevated)', 
				'surface-hover': 'var(--surface-hover)',
				'surface-pressed': 'var(--surface-pressed)',
				'surface-glass': 'var(--surface-glass)',
				'glass': 'var(--glass-bg)'
			},
			borderColor: {
				'glass': 'var(--glass-border)'
			},
			transitionProperty: {
				'fast': 'var(--transition-fast)',
				'normal': 'var(--transition-normal)',
				'slow': 'var(--transition-slow)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
		keyframes: {
			// Accordion animations
			'accordion-down': {
				from: { height: '0', opacity: '0' },
				to: { height: 'var(--radix-accordion-content-height)', opacity: '1' }
			},
			'accordion-up': {
				from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
				to: { height: '0', opacity: '0' }
			},
			// Apple-inspired fluid animations
			'spring-in': {
				'0%': { 
					transform: 'scale(0.8) translateY(20px)', 
					opacity: '0',
					filter: 'blur(4px)'
				},
				'60%': { 
					transform: 'scale(1.02) translateY(-2px)', 
					opacity: '0.8',
					filter: 'blur(1px)'
				},
				'100%': { 
					transform: 'scale(1) translateY(0)', 
					opacity: '1',
					filter: 'blur(0px)'
				}
			},
			'spring-out': {
				'0%': { 
					transform: 'scale(1) translateY(0)', 
					opacity: '1',
					filter: 'blur(0px)'
				},
				'40%': { 
					transform: 'scale(0.98) translateY(2px)', 
					opacity: '0.6',
					filter: 'blur(1px)'
				},
				'100%': { 
					transform: 'scale(0.8) translateY(20px)', 
					opacity: '0',
					filter: 'blur(4px)'
				}
			},
			'float': {
				'0%, 100%': { transform: 'translateY(0px)' },
				'50%': { transform: 'translateY(-4px)' }
			},
			'pulse-glow': {
				'0%, 100%': { 
					boxShadow: '0 0 20px hsl(var(--primary) / 0.3)',
					transform: 'scale(1)'
				},
				'50%': { 
					boxShadow: '0 0 40px hsl(var(--primary) / 0.5)',
					transform: 'scale(1.02)'
				}
			},
			'slide-up-fade': {
				'0%': { 
					transform: 'translateY(40px)', 
					opacity: '0',
					filter: 'blur(8px)'
				},
				'100%': { 
					transform: 'translateY(0)', 
					opacity: '1',
					filter: 'blur(0px)'
				}
			},
			'shimmer': {
				'0%': { backgroundPosition: '-200% 0' },
				'100%': { backgroundPosition: '200% 0' }
			}
		},
		animation: {
			'accordion-down': 'accordion-down 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
			'accordion-up': 'accordion-up 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
			'spring-in': 'spring-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
			'spring-out': 'spring-out 0.4s cubic-bezier(0.6, -0.28, 0.735, 0.045)',
			'float': 'float 3s ease-in-out infinite',
			'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
			'slide-up-fade': 'slide-up-fade 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
			'shimmer': 'shimmer 2s linear infinite'
		}
		}
	},
	plugins: [import("tailwindcss-animate")],
} satisfies Config;
