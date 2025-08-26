#!/usr/bin/env node

/**
 * Comprehensive Admin Panel Test Suite
 * Tests all admin panel functionality including user management, world editing, dialogue management, and RBAC
 * Usage: node test-admin-panel-comprehensive.js
 */

const http = require('http');
const { v4: uuidv4 } = require('uuid');

class AdminPanelTester {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.logger = console;
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            tests: []
        };

        // Test user sessions
        this.sessions = new Map();
    }

    log(message, status = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = status === 'error' ? '❌' : status === 'success' ? '✅' : 'ℹ️';
        this.logger.log(`[${timestamp}] ${prefix} ${message}`);
    }

    recordTest(name, passed, error = null) {
        this.testResults.total++;
        if (passed) {
            this.testResults.passed++;
        } else {
            this.testResults.failed++;
        }

        this.testResults.tests.push({
            name,
            passed,
            error: error?.message,
            timestamp: new Date()
        });

        this.log(`${name}: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'success' : 'error');
        if (error) {
            this.log(`  Error: ${error.message}`, 'error');
        }
    }

    async makeRequest(method, path, data = null, sessionId = null) {
        return new Promise((resolve, reject) => {
            const url = `${this.baseUrl}${path}`;
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (sessionId) {
                options.headers['Authorization'] = `Bearer ${sessionId}`;
            }

            const req = http.request(url, options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        const response = {
                            statusCode: res.statusCode,
                            headers: res.headers,
                            body: body ? JSON.parse(body) : null
                        };
                        resolve(response);
                    } catch (error) {
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            body: body
                        });
                    }
                });
            });

            req.on('error', reject);

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    // User Authentication Tests
    async testUserAuthentication() {
        this.log('Starting User Authentication Tests');

        // Test 1: Login as admin
        try {
            const response = await this.makeRequest('POST', '/api/auth/login', {
                username: 'admin',
                password: 'admin123'
            });

            if (response.statusCode === 200 && response.body?.success) {
                this.sessions.set('admin', response.body.sessionId || 'mock-session-admin');
                this.recordTest('Admin Login', true);
            } else {
                throw new Error(`Login failed: ${response.statusCode} - ${JSON.stringify(response.body)}`);
            }
        } catch (error) {
            this.recordTest('Admin Login', false, error);
        }

        // Test 2: Login as moderator
        try {
            const response = await this.makeRequest('POST', '/api/auth/login', {
                username: 'mod',
                password: 'mod123'
            });

            if (response.statusCode === 200 && response.body?.success) {
                this.sessions.set('mod', response.body.sessionId || 'mock-session-mod');
                this.recordTest('Moderator Login', true);
            } else {
                throw new Error(`Login failed: ${response.statusCode} - ${JSON.stringify(response.body)}`);
            }
        } catch (error) {
            this.recordTest('Moderator Login', false, error);
        }

        // Test 3: Login as player
        try {
            const response = await this.makeRequest('POST', '/api/auth/login', {
                username: 'player',
                password: 'player123'
            });

            if (response.statusCode === 200 && response.body?.success) {
                this.sessions.set('player', response.body.sessionId || 'mock-session-player');
                this.recordTest('Player Login', true);
            } else {
                throw new Error(`Login failed: ${response.statusCode} - ${JSON.stringify(response.body)}`);
            }
        } catch (error) {
            this.recordTest('Player Login', false, error);
        }

        // Test 4: Invalid login
        try {
            const response = await this.makeRequest('POST', '/api/auth/login', {
                username: 'invalid',
                password: 'invalid'
            });

            if (response.statusCode === 401 || (response.body && !response.body.success)) {
                this.recordTest('Invalid Login Rejection', true);
            } else {
                throw new Error(`Invalid login should have been rejected: ${response.statusCode}`);
            }
        } catch (error) {
            this.recordTest('Invalid Login Rejection', false, error);
        }
    }

    // User Management Tests
    async testUserManagement() {
        this.log('Starting User Management Tests');
        const adminSession = this.sessions.get('admin');

        // Test 1: Get all users (admin only)
        try {
            const response = await this.makeRequest('GET', '/admin/users', null, adminSession);

            if (response.statusCode === 200 && response.body?.users) {
                this.recordTest('Get All Users (Admin)', true);
            } else {
                throw new Error(`Failed to get users: ${response.statusCode}`);
            }
        } catch (error) {
            this.recordTest('Get All Users (Admin)', false, error);
        }

        // Test 2: Get all users (moderator should work)
        try {
            const modSession = this.sessions.get('mod');
            const response = await this.makeRequest('GET', '/admin/users', null, modSession);

            if (response.statusCode === 200 && response.body?.users) {
                this.recordTest('Get All Users (Moderator)', true);
            } else {
                throw new Error(`Failed to get users: ${response.statusCode}`);
            }
        } catch (error) {
            this.recordTest('Get All Users (Moderator)', false, error);
        }

        // Test 3: Get all users (player should be denied)
        try {
            const playerSession = this.sessions.get('player');
            const response = await this.makeRequest('GET', '/admin/users', null, playerSession);

            if (response.statusCode === 403 || response.statusCode === 401) {
                this.recordTest('Get All Users (Player Denied)', true);
            } else {
                throw new Error(`Player should not access user management: ${response.statusCode}`);
            }
        } catch (error) {
            this.recordTest('Get All Users (Player Denied)', false, error);
        }

        // Test 4: Create new user
        try {
            const newUser = {
                username: `testuser_${Date.now()}`,
                password: 'testpass123',
                role: 'player'
            };

            const response = await this.makeRequest('POST', '/admin/users', newUser, adminSession);

            if (response.statusCode === 201 || (response.body && response.body.success)) {
                this.recordTest('Create New User', true);
            } else {
                throw new Error(`Failed to create user: ${response.statusCode} - ${JSON.stringify(response.body)}`);
            }
        } catch (error) {
            this.recordTest('Create New User', false, error);
        }

        // Test 5: Promote user role
        try {
            const response = await this.makeRequest('PUT', '/admin/users/player/role', {
                role: 'moderator'
            }, adminSession);

            if (response.statusCode === 200 && response.body?.success) {
                this.recordTest('Promote User Role', true);
            } else {
                throw new Error(`Failed to promote user: ${response.statusCode}`);
            }
        } catch (error) {
            this.recordTest('Promote User Role', false, error);
        }
    }

    // World Management Tests
    async testWorldManagement() {
        this.log('Starting World Management Tests');
        const adminSession = this.sessions.get('admin');
        const modSession = this.sessions.get('mod');

        // Test 1: Get world overview (admin)
        try {
            const response = await this.makeRequest('GET', '/admin/world/overview', null, adminSession);

            if (response.statusCode === 200 && response.body) {
                this.recordTest('Get World Overview (Admin)', true);
            } else {
                throw new Error(`Failed to get world overview: ${response.statusCode}`);
            }
        } catch (error) {
            this.recordTest('Get World Overview (Admin)', false, error);
        }

        // Test 2: Get world overview (moderator)
        try {
            const response = await this.makeRequest('GET', '/admin/world/overview', null, modSession);

            if (response.statusCode === 200 && response.body) {
                this.recordTest('Get World Overview (Moderator)', true);
            } else {
                throw new Error(`Failed to get world overview: ${response.statusCode}`);
            }
        } catch (error) {
            this.recordTest('Get World Overview (Moderator)', false, error);
        }

        // Test 3: Get all rooms
        try {
            const response = await this.makeRequest('GET', '/admin/world/rooms', null, modSession);

            if (response.statusCode === 200 && Array.isArray(response.body)) {
                this.recordTest('Get All Rooms', true);
            } else {
                throw new Error(`Failed to get rooms: ${response.statusCode}`);
            }
        } catch (error) {
            this.recordTest('Get All Rooms', false, error);
        }

        // Test 4: Create new room (admin only)
        try {
            const newRoom = {
                name: 'Test Room',
                description: 'A test room created by automated tests',
                exits: { north: 'existing_room' },
                npcs: [],
                items: ['test_item'],
                players: []
            };

            const response = await this.makeRequest('POST', '/admin/world/rooms', newRoom, adminSession);

            if (response.statusCode === 201 || (response.body && response.body.success)) {
                this.recordTest('Create New Room (Admin)', true);
            } else {
                throw new Error(`Failed to create room: ${response.statusCode}`);
            }
        } catch (error) {
            this.recordTest('Create New Room (Admin)', false, error);
        }

        // Test 5: Create new room (moderator should be denied)
        try {
            const newRoom = {
                name: 'Test Room 2',
                description: 'A test room that should fail',
                exits: {},
                npcs: [],
                items: [],
                players: []
            };

            const response = await this.makeRequest('POST', '/admin/world/rooms', newRoom, modSession);

            if (response.statusCode === 403 || response.statusCode === 401) {
                this.recordTest('Create New Room (Moderator Denied)', true);
            } else {
                throw new Error(`Moderator should not create rooms: ${response.statusCode}`);
            }
        } catch (error) {
            this.recordTest('Create New Room (Moderator Denied)', false, error);
        }

        // Test 6: Get all NPCs
        try {
            const response = await this.makeRequest('GET', '/admin/world/npcs', null, modSession);

            if (response.statusCode === 200 && Array.isArray(response.body)) {
                this.recordTest('Get All NPCs', true);
            } else {
                throw new Error(`Failed to get NPCs: ${response.statusCode}`);
            }
        } catch (error) {
            this.recordTest('Get All NPCs', false, error);
        }

        // Test 7: Get all items
        try {
            const response = await this.makeRequest('GET', '/admin/world/items', null, modSession);

            if (response.statusCode === 200 && Array.isArray(response.body)) {
                this.recordTest('Get All Items', true);
            } else {
                throw new Error(`Failed to get items: ${response.statusCode}`);
            }
        } catch (error) {
            this.recordTest('Get All Items', false, error);
        }
    }

    // Dialogue Management Tests
    async testDialogueManagement() {
        this.log('Starting Dialogue Management Tests');
        const adminSession = this.sessions.get('admin');
        const modSession = this.sessions.get('mod');

        // Test 1: Get all dialogue trees (admin)
        try {
            const response = await this.makeRequest('GET', '/admin/dialogue/trees', null, adminSession);

            if (response.statusCode === 200 && Array.isArray(response.body)) {
                this.recordTest('Get All Dialogue Trees (Admin)', true);
            } else {
                throw new Error(`Failed to get dialogue trees: ${response.statusCode}`);
            }
        } catch (error) {
            this.recordTest('Get All Dialogue Trees (Admin)', false, error);
        }

        // Test 2: Get all dialogue trees (moderator)
        try {
            const response = await this.makeRequest('GET', '/admin/dialogue/trees', null, modSession);

            if (response.statusCode === 200 && Array.isArray(response.body)) {
                this.recordTest('Get All Dialogue Trees (Moderator)', true);
            } else {
                throw new Error(`Failed to get dialogue trees: ${response.statusCode}`);
            }
        } catch (error) {
            this.recordTest('Get All Dialogue Trees (Moderator)', false, error);
        }

        // Test 3: Create new dialogue tree (admin only)
        try {
            const newDialogueTree = {
                npcId: `test_dialogue_${Date.now()}`,
                name: 'Test Dialogue Tree',
                description: 'A test dialogue tree',
                rootNodeId: 'greeting',
                nodes: {
                    'greeting': {
                        id: 'greeting',
                        npcId: `test_dialogue_${Date.now()}`,
                        text: 'Hello! Welcome to our automated test!',
                        responses: [
                            {
                                id: 'response1',
                                text: 'Thank you!',
                                nextNodeId: 'goodbye'
                            }
                        ]
                    },
                    'goodbye': {
                        id: 'goodbye',
                        npcId: `test_dialogue_${Date.now()}`,
                        text: 'Goodbye and good luck with your tests!',
                        responses: [],
                        isEndNode: true
                    }
                },
                variables: {}
            };

            const response = await this.makeRequest('POST', '/admin/dialogue/trees', newDialogueTree, adminSession);

            if (response.statusCode === 201 || (response.body && response.body.success)) {
                this.recordTest('Create New Dialogue Tree (Admin)', true);
            } else {
                throw new Error(`Failed to create dialogue tree: ${response.statusCode}`);
            }
        } catch (error) {
            this.recordTest('Create New Dialogue Tree (Admin)', false, error);
        }

        // Test 4: Create new dialogue tree (moderator should be denied)
        try {
            const newDialogueTree = {
                npcId: 'test_dialogue_fail',
                name: 'Test Dialogue Tree Fail',
                description: 'This should fail',
                rootNodeId: 'greeting',
                nodes: {},
                variables: {}
            };

            const response = await this.makeRequest('POST', '/admin/dialogue/trees', newDialogueTree, modSession);

            if (response.statusCode === 403 || response.statusCode === 401) {
                this.recordTest('Create New Dialogue Tree (Moderator Denied)', true);
            } else {
                throw new Error(`Moderator should not create dialogue trees: ${response.statusCode}`);
            }
        } catch (error) {
            this.recordTest('Create New Dialogue Tree (Moderator Denied)', false, error);
        }

        // Test 5: Get dialogue templates
        try {
            const response = await this.makeRequest('GET', '/admin/dialogue/templates', null, modSession);

            if (response.statusCode === 200 && Array.isArray(response.body)) {
                this.recordTest('Get Dialogue Templates', true);
            } else {
                throw new Error(`Failed to get dialogue templates: ${response.statusCode}`);
            }
        } catch (error) {
            this.recordTest('Get Dialogue Templates', false, error);
        }
    }

    // Session Persistence Tests
    async testSessionPersistence() {
        this.log('Starting Session Persistence Tests');

        // Test 1: Session persistence after login
        try {
            // Login and check if session persists
            const response = await this.makeRequest('POST', '/api/auth/login', {
                username: 'admin',
                password: 'admin123'
            });

            if (response.statusCode === 200 && response.body?.success) {
                const sessionId = response.body.sessionId || 'mock-session-admin';

                // Try to access a protected endpoint with the session
                const protectedResponse = await this.makeRequest('GET', '/admin/users', null, sessionId);

                if (protectedResponse.statusCode === 200) {
                    this.recordTest('Session Persistence', true);
                } else {
                    throw new Error(`Session should persist: ${protectedResponse.statusCode}`);
                }
            } else {
                throw new Error(`Login failed: ${response.statusCode}`);
            }
        } catch (error) {
            this.recordTest('Session Persistence', false, error);
        }

        // Test 2: Session invalidation on logout
        try {
            const sessionId = this.sessions.get('admin') || 'mock-session-admin';

            // Attempt logout
            const response = await this.makeRequest('POST', '/api/auth/logout', {}, sessionId);

            if (response.statusCode === 200 || response.statusCode === 204) {
                // Try to access protected endpoint after logout
                const protectedResponse = await this.makeRequest('GET', '/admin/users', null, sessionId);

                if (protectedResponse.statusCode === 401 || protectedResponse.statusCode === 403) {
                    this.recordTest('Session Invalidation on Logout', true);
                } else {
                    throw new Error(`Session should be invalidated after logout: ${protectedResponse.statusCode}`);
                }
            } else {
                throw new Error(`Logout failed: ${response.statusCode}`);
            }
        } catch (error) {
            this.recordTest('Session Invalidation on Logout', false, error);
        }
    }

    // RBAC Tests
    async testRoleBasedAccessControl() {
        this.log('Starting RBAC Tests');

        // Test 1: Admin can access all endpoints
        try {
            const adminSession = this.sessions.get('admin');
            const endpoints = [
                '/admin/users',
                '/admin/world/overview',
                '/admin/dialogue/trees'
            ];

            let allAccessible = true;
            for (const endpoint of endpoints) {
                const response = await this.makeRequest('GET', endpoint, null, adminSession);
                if (response.statusCode !== 200) {
                    allAccessible = false;
                    break;
                }
            }

            if (allAccessible) {
                this.recordTest('Admin Access to All Endpoints', true);
            } else {
                throw new Error('Admin should access all endpoints');
            }
        } catch (error) {
            this.recordTest('Admin Access to All Endpoints', false, error);
        }

        // Test 2: Moderator limited access
        try {
            const modSession = this.sessions.get('mod');

            // Should be able to access these
            const allowedEndpoints = [
                '/admin/users',
                '/admin/world/overview',
                '/admin/dialogue/trees'
            ];

            // Should NOT be able to access these
            const adminOnlyEndpoints = [
                '/admin/world/rooms',
                '/admin/dialogue/trees'
            ];

            let accessCorrect = true;

            // Check allowed endpoints
            for (const endpoint of allowedEndpoints) {
                const response = await this.makeRequest('GET', endpoint, null, modSession);
                if (response.statusCode !== 200) {
                    accessCorrect = false;
                    break;
                }
            }

            // Check admin-only endpoints (should be denied)
            if (accessCorrect) {
                for (const endpoint of adminOnlyEndpoints) {
                    const response = await this.makeRequest('POST', endpoint, {}, modSession);
                    if (response.statusCode !== 403 && response.statusCode !== 401) {
                        accessCorrect = false;
                        break;
                    }
                }
            }

            if (accessCorrect) {
                this.recordTest('Moderator Limited Access', true);
            } else {
                throw new Error('Moderator access control is not working correctly');
            }
        } catch (error) {
            this.recordTest('Moderator Limited Access', false, error);
        }

        // Test 3: Player denied all admin access
        try {
            const playerSession = this.sessions.get('player');
            const adminEndpoints = [
                '/admin/users',
                '/admin/world/overview',
                '/admin/dialogue/trees'
            ];

            let allDenied = true;
            for (const endpoint of adminEndpoints) {
                const response = await this.makeRequest('GET', endpoint, null, playerSession);
                if (response.statusCode === 200) {
                    allDenied = false;
                    break;
                }
            }

            if (allDenied) {
                this.recordTest('Player Denied Admin Access', true);
            } else {
                throw new Error('Player should be denied all admin access');
            }
        } catch (error) {
            this.recordTest('Player Denied Admin Access', false, error);
        }
    }

    async runAllTests() {
        this.log('🚀 Starting Comprehensive Admin Panel Test Suite');
        this.log('=' .repeat(60));

        try {
            // Run all test suites
            await this.testUserAuthentication();
            await this.testUserManagement();
            await this.testWorldManagement();
            await this.testDialogueManagement();
            await this.testSessionPersistence();
            await this.testRoleBasedAccessControl();

        } catch (error) {
            this.log(`Test suite error: ${error.message}`, 'error');
        }

        // Print results
        this.printResults();
    }

    printResults() {
        this.log('\n' + '='.repeat(60));
        this.log('📊 TEST RESULTS SUMMARY');
        this.log('='.repeat(60));
        this.log(`Total Tests: ${this.testResults.total}`);
        this.log(`Passed: ${this.testResults.passed}`);
        this.log(`Failed: ${this.testResults.failed}`);
        this.log(`Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(2)}%`);

        if (this.testResults.failed > 0) {
            this.log('\n❌ FAILED TESTS:');
            this.testResults.tests
                .filter(test => !test.passed)
                .forEach(test => {
                    this.log(`  • ${test.name}`);
                    if (test.error) {
                        this.log(`    Error: ${test.error}`);
                    }
                });
        }

        this.log('\n✅ PASSED TESTS:');
        this.testResults.tests
            .filter(test => test.passed)
            .forEach(test => {
                this.log(`  • ${test.name}`);
            });

        this.log('\n' + '='.repeat(60));
        this.log('🏁 Test Suite Complete');
        this.log('='.repeat(60));
    }
}

// Run the test suite if called directly
if (require.main === module) {
    const tester = new AdminPanelTester();

    // Check if server is running
    tester.log('Checking if server is running...');

    const checkServer = async () => {
        try {
            const response = await tester.makeRequest('GET', '/health');
            if (response.statusCode === 200) {
                tester.log('✅ Server is running');
                await tester.runAllTests();
            } else {
                throw new Error(`Server responded with ${response.statusCode}`);
            }
        } catch (error) {
            tester.log('❌ Server is not running. Please start the server first.', 'error');
            tester.log('Run: npm run dev', 'error');
            process.exit(1);
        }
    };

    checkServer().catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = AdminPanelTester;