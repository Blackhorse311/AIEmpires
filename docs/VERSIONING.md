# AIEmpires Versioning Guide

This document outlines the semantic versioning strategy for the AIEmpires project.

## Semantic Versioning (SemVer)

AIEmpires follows [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

### Version Components

#### MAJOR (X.0.0)
Incremented for incompatible API changes or breaking changes:
- Changes that break save file compatibility
- Removal of supported features
- Changes to mod.json format requirements
- Major architecture restructuring

**Examples:**
- v1.0.0 → v2.0.0: Complete rewrite of faction AI system
- v1.5.0 → v2.0.0: Save file format change

#### MINOR (0.X.0)
Incremented for backwards-compatible new functionality:
- New faction support
- New era content
- New LLM provider support
- New UI features
- Performance improvements

**Examples:**
- v1.0.0 → v1.1.0: Added Groq provider support
- v1.1.0 → v1.2.0: Added ilClan era content

#### PATCH (0.0.X)
Incremented for backwards-compatible bug fixes:
- Bug fixes
- Security patches
- Documentation updates
- Minor UI tweaks
- Typo corrections

**Examples:**
- v1.0.0 → v1.0.1: Fixed game detection on GOG installations
- v1.0.1 → v1.0.2: Fixed API key validation error

## Pre-release Versions

For development and testing:

```
1.0.0-alpha.1   # Early development, unstable
1.0.0-beta.1    # Feature complete, testing
1.0.0-rc.1      # Release candidate
```

## Component Versions

Each component maintains its own version:

| Component | Current Version | Location |
|-----------|----------------|----------|
| Launcher | 1.0.0 | `launcher/package.json` |
| AI Service | 1.0.0 | `ai-service/pyproject.toml` |
| Game Mod | 1.0.0 | `game-mod/AIEmpires/mod.json` |

## Version Scripts

The launcher includes npm scripts for version management:

```bash
# Patch version (1.0.0 → 1.0.1)
npm run version:patch

# Minor version (1.0.0 → 1.1.0)
npm run version:minor

# Major version (1.0.0 → 2.0.0)
npm run version:major
```

## Changelog Format

All version changes should be documented in CHANGELOG.md:

```markdown
## [1.1.0] - 2024-12-30

### Added
- New feature description

### Changed
- Modified behavior description

### Fixed
- Bug fix description

### Deprecated
- Feature being phased out

### Removed
- Removed feature

### Security
- Security fix description
```

## Release Process

1. **Update version numbers** in all component files
2. **Update CHANGELOG.md** with release notes
3. **Create git tag** with version number
4. **Build release** using `npm run package`
5. **Create GitHub release** with built artifacts
6. **Update manifest.json** if mod versions changed

## Compatibility Matrix

| Launcher | AI Service | Game Mod | BattleTech |
|----------|------------|----------|------------|
| 1.0.x | 1.0.x | 1.0.x | 1.9.1+ |

---

*Last updated: December 2024*
