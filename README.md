# Reality Check Suite

> **Social Media & AI Manipulation Detector** - Your digital wellbeing companion

An open-source browser extension that helps individuals recognize and mitigate algorithm-driven cognitive distortion across LLM chats and mainstream social platforms.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.1.0-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![Preact](https://img.shields.io/badge/Preact-673AB8?logo=preact&logoColor=white)

## ✨ Features

### 🎯 Core Functionality
- **Real-time Content Analysis**: On-device NLP pipeline using DistilBERT for sentiment analysis
- **Cognitive Distortion Detection**: Identifies persecution, grandiosity, conspiracy patterns, and more
- **Rage-Scroll Detection**: Monitors scrolling behavior for compulsive patterns
- **Vulnerability Index (VI)**: 0-100 score combining multiple behavioral indicators
- **Privacy-First**: All processing happens locally on your device

### 🛡️ Supported Platforms
- **AI Chats**: ChatGPT, Claude, Gemini
- **Social Media**: Twitter/X, Reddit, Facebook, YouTube
- **Extensible**: Easy to add new site adapters

### 🎨 User Interface
- **Traffic Light Widget**: Minimalist VI indicator with expandable details
- **Smart Interventions**: Context-aware break suggestions and mindfulness prompts
- **Dark Mode Support**: Adapts to system preferences
- **Accessibility**: Full keyboard navigation and screen reader support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Chrome or Firefox browser
- Basic understanding of TypeScript (for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/reality-check-suite/reality-check-suite.git
   cd reality-check-suite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in browser**
   - **Chrome**: Go to `chrome://extensions/`, enable "Developer mode", click "Load unpacked", select the `dist` folder
   - **Firefox**: Go to `about:debugging`, click "This Firefox", click "Load Temporary Add-on", select the `manifest.json` from `dist`

### Development

```bash
# Start development server with hot reload
npm run dev

# Run linting
npm run lint

# Run tests
npm run test

# Build for production
npm run build
```

## 🏗️ Architecture

### System Overview
```
┌─────────────┐       ┌──────────────┐       ┌──────────────────┐
│ Content DOM │────► │  Extractor    │────► │  Signal Engine   │
└─────────────┘       └──────────────┘       └──────────────────┘
                                         ┌──────────────┐
                                         │  Local Store │
                                         └──────────────┘
                                                     │
                                                     ▼
                                         ┌──────────────────┐
                                         │  UI / Intervene  │
                                         └──────────────────┘
```

### Core Components

#### 🔍 **Site Adapters** (`src/content/adapters/`)
Platform-specific DOM monitors that implement a common interface:
- `ChatGPTExtractor`: Handles OpenAI chat interface
- `TwitterExtractor`: Processes tweets, replies, and social interactions
- `BaseDOMExtractor`: Abstract base class for consistent extraction patterns

#### 🧠 **NLP Pipeline** (`src/nlp/`)
- `SentimentAnalyzer`: DistilBERT-based emotional analysis (valence/arousal)
- `DistortionDetector`: Rule-based cognitive distortion identification
- `RageDetector`: Aggressive language and emotional intensity detection
- `NLPPipeline`: Orchestrates all analysis components

#### 📊 **Vulnerability Index** (`src/analysis/`)
Combines multiple signals into a single 0-100 risk score:
```
VI = σ(w_s·Sentiment + w_d·Distortion + w_r·Rage + w_t·TimeIntensity + w_c·CrossPlatform + w_sc·Scroll)
```

#### 🎨 **UI Components** (`src/widget/`)
- `VIWidget`: Main traffic light interface
- Real-time updates with smooth animations
- Responsive design with accessibility features

## 📈 Vulnerability Index (VI) Explained

The VI combines six key components:

| Component | Weight | Description |
|-----------|---------|-------------|
| **Sentiment** | 25% | Negative valence + high arousal patterns |
| **Distortion** | 35% | Cognitive bias detection (persecution, conspiracy, etc.) |
| **Rage** | 20% | Aggressive language and threat indicators |
| **Time Intensity** | 10% | Sustained high-risk behavior duration |
| **Cross-Platform** | 5% | Risk amplification across multiple platforms |
| **Scroll** | 5% | Rage-scrolling and compulsive behavior patterns |

### Risk Levels
- **0-40**: 🟢 Minimal risk
- **40-70**: 🟡 Low to medium risk  
- **70-85**: 🟠 Medium to high risk
- **85-100**: 🔴 High risk - intervention recommended

## 🛠️ Configuration

### Default Settings
```json
{
  "enabledPlatforms": ["chatgpt", "twitter", "reddit"],
  "interventionThresholds": {
    "gentle_nudge": { "enabled": true, "threshold": 70 },
    "break_suggestion": { "enabled": true, "threshold": 80 },
    "grey_out": { "enabled": false, "threshold": 90 }
  },
  "privacySettings": {
    "localProcessingOnly": true,
    "encryptStorage": true,
    "shareAnonymousData": false
  }
}
```

### Customization
- **Intervention Rules**: Modify thresholds and trigger conditions
 - **Platform Support**: Add new adapters for additional websites
- **UI Themes**: Customize colors and positioning
- **Privacy Controls**: Configure data retention and sharing preferences

## 🔒 Privacy & Security

### Privacy-First Design
- **Local Processing**: All NLP analysis happens on your device
- **No Cloud Dependencies**: Optional telemetry only with explicit consent
- **Encrypted Storage**: Local data encrypted with user passphrase
- **Minimal Permissions**: Only requests necessary browser APIs

### Data Handling
- **Content**: Processed locally, never transmitted
- **Metrics**: Anonymized patterns only (if opted in)
- **Storage**: 5-minute rolling window, auto-cleanup
- **Compliance**: GDPR-ready architecture

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Run the test suite: `npm test`
6. Submit a pull request

### Areas for Contribution
- **Platform Extractors**: Add support for new websites
- **NLP Models**: Improve distortion detection accuracy  
- **UI/UX**: Enhance accessibility and user experience
- **Research**: Validate intervention effectiveness
- **Documentation**: Improve guides and examples

## 📚 Research & Validation

### Evaluation Metrics
- **False Positive Rate** < 15% (expert annotated sessions)
- **Mean Time-to-Intervention** when VI > 80
- **User Accept Rate** of suggested breaks
- **Self-reported wellbeing delta** over 4-week trials

### Ethical Considerations
- Partnership with cognitive psychologists for dataset curation
- Periodic IRB-like review for new features
- Clear disclaimers: *not a substitute for professional care*

## 🗺️ Roadmap

### v0.2 - Multi-Platform Social Feed (4 weeks)
- Reddit and Facebook adapters
- Enhanced rage-scroll heuristics
- Cross-platform correlation

### v0.3 - Advanced NLP (8 weeks)  
- WASM-optimized transformer models
- Improved cognitive distortion detection
- Multi-language support

### v0.4 - Personal Calibration (12 weeks)
- Individual baseline establishment
- Adaptive thresholds
- Personal usage analytics

### v0.5 - Community Features (16 weeks)
- Crowdsourced pattern validation
- Anonymous usage insights
- Research contribution tools

## 🛡️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Transformers.js** for browser-based ML inference
- **Preact** for lightweight UI components  
- **Tailwind CSS** for utility-first styling
- **Open-source community** for privacy-focused alternatives

## 📞 Support

- **Documentation**: [Wiki](https://github.com/reality-check-suite/reality-check-suite/wiki)
- **Issues**: [GitHub Issues](https://github.com/reality-check-suite/reality-check-suite/issues)
- **Discussions**: [GitHub Discussions](https://github.com/reality-check-suite/reality-check-suite/discussions)
- **Security**: [Security Policy](SECURITY.md)

---

**⚠️ Important Disclaimer**: Reality Check Suite is a digital wellbeing tool and is not intended to diagnose, treat, cure, or prevent any mental health condition. Always consult with qualified healthcare professionals for mental health concerns.

**🔬 Research Use**: If you're interested in using Reality Check Suite for academic research, please reach out via [research@realitycheck.dev](mailto:research@realitycheck.dev). 