# The Ops Center

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 🚀 AI-Powered Operations Center

The Ops Center is a comprehensive AI-driven operations management platform built with React, TypeScript, and Google Gemini AI. It provides intelligent task management, career planning, document analysis, and voice-controlled operations.

## ✨ Features

- **AI-Powered Task Management** - Intelligent task organization and prioritization
- **Career Blueprint Planning** - AI-driven career development and goal setting
- **Document Analysis** - Advanced document processing with Gemini AI
- **Voice Control** - Voice-activated operations and commands
- **Responsive Design** - Modern, mobile-friendly interface
- **Real-time Updates** - Live data synchronization and updates

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **AI Integration**: Google Gemini 2.5 Pro via GenKit
- **Database**: Dexie (IndexedDB)
- **Styling**: Modern CSS with responsive design
- **Deployment**: GitHub Pages + GitHub Actions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Gemini API Key

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/4citeB4U/TheOps.git
   cd TheOps
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🏗️ Building for Production

```bash
npm run build
npm run preview
```

## 🚀 Deployment

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

### GitHub Pages Setup

1. **Enable GitHub Pages** in your repository settings
2. **Set source to GitHub Actions**
3. **Add your Gemini API key as a repository secret**:
   - Go to Settings → Secrets and variables → Actions
   - Add `GEMINI_API_KEY` with your API key

### Manual Deployment

The workflow automatically triggers on pushes to the `main` branch, but you can also manually trigger it:

1. Go to Actions tab in your repository
2. Select "Build & Deploy (Vite → GitHub Pages)"
3. Click "Run workflow"

## 📁 Project Structure

```
TheOps/
├── components/          # React components
│   ├── ambiance/       # Background and particle effects
│   ├── layout/         # Layout components
│   ├── modals/         # Modal dialogs
│   ├── settings/       # Settings components
│   ├── utils/          # Utility components
│   ├── views/          # Main view components
│   └── voice/          # Voice control components
├── contexts/           # React contexts
├── services/           # API and service layer
├── types/              # TypeScript type definitions
└── .github/workflows/  # GitHub Actions workflows
```

## 🔧 Configuration

### Environment Variables

- `GEMINI_API_KEY` - Your Google Gemini API key (required)
- `VITE_DISABLE_SW` - Disable service worker (set to "1" for GitHub Pages)

### Vite Configuration

The project is configured with:
- Base path for GitHub Pages deployment
- React plugin
- Environment variable injection
- Service worker configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Open an issue on GitHub
- Check the documentation
- Review the code examples

## 🔮 Roadmap

- [ ] Enhanced AI capabilities
- [ ] Mobile app version
- [ ] Team collaboration features
- [ ] Advanced analytics dashboard
- [ ] Integration with more AI services

---

**Built with ❤️ using React, TypeScript, and Google Gemini AI**
