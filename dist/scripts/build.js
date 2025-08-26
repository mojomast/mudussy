#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
function countFiles(dir) {
    let count = 0;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            count += countFiles(filePath);
        }
        else {
            count++;
        }
    }
    return count;
}
function getDirectorySize(dirPath) {
    let totalSize = 0;
    function calculateSize(filePath) {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            const files = fs.readdirSync(filePath);
            files.forEach(file => {
                calculateSize(path.join(filePath, file));
            });
        }
        else {
            totalSize += stat.size;
        }
    }
    calculateSize(dirPath);
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = totalSize;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
}
console.log('🔨 MUD Engine Build Script');
console.log('==========================\n');
try {
    const projectRoot = path.join(__dirname, '..');
    console.log('🧹 Cleaning previous build...');
    const distPath = path.join(projectRoot, 'dist');
    if (fs.existsSync(distPath)) {
        fs.rmSync(distPath, { recursive: true, force: true });
        console.log('  ✅ Cleaned dist directory');
    }
    console.log('📦 Compiling TypeScript...');
    execSync('npx tsc', { stdio: 'inherit', cwd: projectRoot });
    console.log('  ✅ TypeScript compilation complete');
    console.log('📋 Copying assets...');
    const packageJson = require(path.join(projectRoot, 'package.json'));
    const prodPackageJson = {
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
        main: packageJson.main,
        scripts: {
            start: 'node dist/server/index.js',
            'start:prod': 'node dist/server/index.js'
        },
        dependencies: packageJson.dependencies,
        keywords: packageJson.keywords,
        author: packageJson.author,
        license: packageJson.license
    };
    fs.writeFileSync(path.join(distPath, 'package.json'), JSON.stringify(prodPackageJson, null, 2));
    console.log('  📝 Created production package.json');
    const readmePath = path.join(projectRoot, 'README.md');
    const licensePath = path.join(projectRoot, 'LICENSE');
    if (fs.existsSync(readmePath)) {
        fs.copyFileSync(readmePath, path.join(distPath, 'README.md'));
        console.log('  📄 Copied README.md');
    }
    if (fs.existsSync(licensePath)) {
        fs.copyFileSync(licensePath, path.join(distPath, 'LICENSE'));
        console.log('  📄 Copied LICENSE');
    }
    const envExamplePath = path.join(projectRoot, '.env.example');
    if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, path.join(distPath, '.env.example'));
        console.log('  ⚙️  Copied .env.example');
    }
    console.log('  ✅ Asset copying complete');
    console.log('🔧 Running post-build tasks...');
    const logsPath = path.join(distPath, 'logs');
    if (!fs.existsSync(logsPath)) {
        fs.mkdirSync(logsPath, { recursive: true });
        console.log('  📂 Created logs directory');
    }
    console.log('  ✅ Post-build tasks complete');
    console.log('\n📊 Build Summary:');
    console.log('================');
    const fileCount = countFiles(distPath);
    console.log(`📁 Output directory: dist/`);
    console.log(`📄 Total files: ${fileCount}`);
    console.log(`📏 Build size: ${getDirectorySize(distPath)}`);
    console.log('\n✅ Build completed successfully!');
    console.log('🚀 Ready for deployment');
    console.log('📦 Production package ready in dist/');
}
catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}
//# sourceMappingURL=build.js.map