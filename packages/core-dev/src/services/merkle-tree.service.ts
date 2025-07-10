import * as fs from 'fs/promises';
import * as sha3 from 'js-sha3';
const rocksdb = require('rocksdb');

/**
 * JavaScript implementation of Keccac-256 hash function
 * Using the proper Keccac-256 algorithm (not SHA3-256)
 */
class Keccac256 {
    static hash256(input1: Buffer | Uint8Array | string, input2: Buffer | Uint8Array | string): Buffer {
        // Concatenate the inputs and hash with Keccac-256
        const combined = Buffer.concat([
            Buffer.isBuffer(input1) ? input1 : Buffer.from(input1),
            Buffer.isBuffer(input2) ? input2 : Buffer.from(input2)
        ]);
        // Use the keccac256 function from js-sha3
        const hexResult = sha3.keccak256(combined);
        // Convert hex string to Buffer
        return Buffer.from(hexResult, 'hex');
    }
}

/**
 * MerkleTreeService: A Merkle Tree backed by RocksDB storage
 * Following the exact Rust implementation logic
 */
type NodeCache = Map<string, Node>;
type HangingNodes = Map<number, Buffer>;
type KeyDataCache = Map<string, Buffer>;

type RocksDBType = ReturnType<typeof rocksdb>;

export default class MerkleTreeService {
    // Static properties
    static HASH_LENGTH = 32;
    static METADATA_CF_NAME = 'metaData';
    static NODES_CF_NAME = 'nodes';
    static KEY_DATA_CF_NAME = 'keyData';

    // Metadata Keys
    static KEY_ROOT_HASH = 'rootHash';
    static KEY_NUM_LEAVES = 'numLeaves';
    static KEY_DEPTH = 'depth';
    static KEY_HANGING_NODE_PREFIX = 'hangingNode';

    static openTrees: Map<string, MerkleTreeService> = new Map();

    treeName: string;
    path: string;
    db!: RocksDBType;
    nodesCache: NodeCache;
    hangingNodes: HangingNodes;
    keyDataCache: KeyDataCache;
    numLeaves: number;
    depth: number;
    rootHash: Buffer | null;
    closed: boolean;
    hasUnsavedChanges: boolean;
    _initPromise: Promise<void> | null;

    constructor(treeName: string) {
        this.treeName = treeName;
        this.path = `merkleTree/${treeName}`;

        if (MerkleTreeService.openTrees.has(treeName)) {
            throw new Error(`There is already an open instance of this tree: ${treeName}`);
        }

        // In-memory caches - using Map with string keys like Rust HashMap
        this.nodesCache = new Map(); // String -> Node
        this.hangingNodes = new Map(); // number -> Buffer
        this.keyDataCache = new Map(); // String -> Buffer

        // Tree state
        this.numLeaves = 0;
        this.depth = 0;
        this.rootHash = null;

        this.closed = false;
        this.hasUnsavedChanges = false;

        // Initialize RocksDB asynchronously
        this._initPromise = this.initializeDb();

        // Register instance
        MerkleTreeService.openTrees.set(treeName, this);
    }

    /**
     * Initialize RocksDB with column families
     */
    async initializeDb(): Promise<void> {
        try {
            // Ensure directory exists
            await fs.mkdir(this.path, { recursive: true });

            // Open RocksDB with column families
            this.db = rocksdb(this.path);
            
            // Open the database
            await new Promise<void>((resolve, reject) => {
                this.db.open({
                    createIfMissing: true,
                    errorIfExists: false,
                    compression: false,
                    cacheSize: 64 * 1024 * 1024, // 64MB cache
                }, (err: Error | null) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            // Load initial metadata
            await this.loadMetaData();
        } catch (error) {
            console.error('Failed to initialize RocksDB:', error);
            throw error;
        }
    }

    /**
     * Ensure the database is initialized before operations
     */
    async ensureInitialized(): Promise<void> {
        if (this._initPromise) {
            await this._initPromise;
            this._initPromise = null;
        }
    }

    /**
     * Get the current root hash of the Merkle tree
     */
    async getRootHash(): Promise<Buffer | null> {
        await this.ensureInitialized();
        this.errorIfClosed();
        return this.rootHash ? Buffer.from(this.rootHash) : null;
    }

    /**
     * Get root hash saved on disk
     */
    async getRootHashSavedOnDisk(): Promise<Buffer | null> {
        await this.ensureInitialized();
        this.errorIfClosed();
        return await this.safeGet(MerkleTreeService.KEY_ROOT_HASH);
    }

    /**
     * Get number of leaves
     */
    async getNumLeaves(): Promise<number> {
        await this.ensureInitialized();
        this.errorIfClosed();
        return this.numLeaves;
    }

    /**
     * Get depth of the tree
     */
    async getDepth(): Promise<number> {
        await this.ensureInitialized();
        this.errorIfClosed();
        return this.depth;
    }

    /**
     * Get data for a key from the Merkle Tree
     */
    async getData(key: Buffer): Promise<Buffer | null> {
        await this.ensureInitialized();
        this.errorIfClosed();
        if (!key || key.length === 0) {
            throw new Error('Key cannot be empty');
        }

        const keyStr = key.toString('hex');
        let data = this.keyDataCache.get(keyStr);
        if (data) {
            return data;
        }

        const keyDataKey = `keyData:${keyStr}`;
        return await this.safeGet(keyDataKey);
    }

    /**
     * Add or update data for a key in the Merkle Tree
     * Following the exact Rust logic
     */
    async addOrUpdateData(key: Buffer, data: Buffer): Promise<void> {
        await this.ensureInitialized();
        this.errorIfClosed();

        if (!key || key.length === 0) {
            throw new Error('Key cannot be empty');
        }
        if (!data || data.length === 0) {
            throw new Error('Data cannot be empty');
        }

        // Check if key already exists
        const existingData = await this.getData(key);
        const oldLeafHash = existingData ? this.calculateLeafHash(key, existingData) : null;

        // Calculate hash from key and data
        const newLeafHash = this.calculateLeafHash(key, data);

        if (oldLeafHash && Buffer.compare(oldLeafHash, newLeafHash) === 0) {
            return; // No change needed
        }

        // Store key-data mapping in cache
        const keyStr = key.toString('hex');
        this.keyDataCache.set(keyStr, Buffer.from(data));
        this.hasUnsavedChanges = true;

        if (!oldLeafHash) {
            // Key doesn't exist, add new leaf
            const leafNode = Node.newLeaf(newLeafHash);
            this.updateNodeInCache(leafNode);
            await this.addLeaf(leafNode);
        } else {
            // Key exists, update leaf
            await this.updateLeaf(oldLeafHash, newLeafHash);
        }
    }

    /**
     * Add a new leaf node to the tree
     * Following the exact Rust logic
     */
    async addLeaf(leafNode: Node): Promise<void> {
        if (this.numLeaves === 0) {
            // First leaf becomes root and hanging at level 0
            this.hangingNodes.set(0, leafNode.hash);
            this.rootHash = leafNode.hash;
            this.numLeaves++;
            this.updateNodeInCache(leafNode);
            return;
        }

        // Check if there's a hanging leaf at level 0
        const hangingLeafHash = this.hangingNodes.get(0);

        if (hangingLeafHash) {
            // Get the hanging leaf node
            const hangingLeaf = await this.getNodeByHash(hangingLeafHash);

            if (hangingLeaf) {
                // Remove from hanging nodes at level 0
                this.hangingNodes.delete(0);

                if (!hangingLeaf.parent) {
                    // Hanging leaf is the root - create parent with both leaves
                    const parentNode = Node.newInternal(hangingLeafHash, leafNode.hash);

                    // Update parent references for both leaves
                    hangingLeaf.setParentNodeHash(parentNode.hash);
                    this.updateNodeInCache(hangingLeaf);

                    leafNode.setParentNodeHash(parentNode.hash);
                    this.updateNodeInCache(leafNode);

                    // Add parent node at level 1
                    await this.addNode(1, parentNode);
                } else {
                    // Hanging leaf has a parent - add new leaf to that parent
                    const parentNode = await this.getNodeByHash(hangingLeaf.parent);
                    if (!parentNode) {
                        throw new Error('Parent node not found');
                    }

                    parentNode.addLeaf(leafNode.hash);

                    // Update new leaf's parent reference
                    leafNode.setParentNodeHash(hangingLeaf.parent);
                    this.updateNodeInCache(leafNode);

                    // Recalculate parent hash and update
                    const newParentHash = parentNode.calculateHash();
                    await this.updateNodeHash(parentNode, newParentHash);
                }
            }
        } else {
            // No hanging leaf at level 0 - make this leaf hanging
            this.hangingNodes.set(0, leafNode.hash);

            // Create a parent node with just this leaf and add it to level 1
            const parentNode = Node.newInternal(leafNode.hash, null);
            leafNode.setParentNodeHash(parentNode.hash);
            this.updateNodeInCache(leafNode);

            await this.addNode(1, parentNode);
        }

        this.numLeaves++;
        this.updateNodeInCache(leafNode);
    }

    /**
     * Add a node at a given level
     * Following the exact Rust logic
     */
    async addNode(level: number, node: Node): Promise<void> {
        // Update depth if necessary
        if (level > this.depth) {
            this.depth = level;
        }

        // Get hanging node at this level
        const hangingNodeHash = this.hangingNodes.get(level);

        if (hangingNodeHash) {
            // There's a hanging node at this level
            const hangingNode = await this.getNodeByHash(hangingNodeHash);

            if (hangingNode) {
                // Remove hanging node from this level
                this.hangingNodes.delete(level);

                if (!hangingNode.parent) {
                    // Hanging node is a root - create parent with both nodes
                    const parent = Node.newInternal(hangingNodeHash, node.hash);

                    // Update parent references
                    hangingNode.setParentNodeHash(parent.hash);
                    this.updateNodeInCache(hangingNode);

                    node.setParentNodeHash(parent.hash);
                    this.updateNodeInCache(node);

                    // Recursively add parent at next level
                    await this.addNode(level + 1, parent);
                } else {
                    // Hanging node has a parent - add new node to that parent
                    const parentNode = await this.getNodeByHash(hangingNode.parent);
                    if (!parentNode) {
                        throw new Error('Parent node not found');
                    }

                    parentNode.addLeaf(node.hash);

                    // Update new node's parent reference
                    node.setParentNodeHash(hangingNode.parent);
                    this.updateNodeInCache(node);

                    // Recalculate parent hash and update
                    const newParentHash = parentNode.calculateHash();
                    await this.updateNodeHash(parentNode, newParentHash);
                }
            }
        } else {
            // No hanging node at this level - make this node hanging
            this.hangingNodes.set(level, node.hash);

            // If this is at or above the current depth, it becomes the new root
            if (level >= this.depth) {
                this.rootHash = node.hash;
            } else {
                // Create a parent node and continue up
                const parentNode = Node.newInternal(node.hash, null);
                node.setParentNodeHash(parentNode.hash);
                this.updateNodeInCache(node);

                await this.addNode(level + 1, parentNode);
            }
        }

        this.updateNodeInCache(node);
    }

    /**
     * Update a leaf node
     */
    async updateLeaf(oldLeafHash: Buffer, newLeafHash: Buffer): Promise<void> {
        if (!oldLeafHash || !newLeafHash) {
            throw new Error('Old and new leaf hashes cannot be null');
        }
        if (Buffer.compare(oldLeafHash, newLeafHash) === 0) {
            throw new Error('Old and new leaf hashes cannot be the same');
        }

        const leaf = await this.getNodeByHash(oldLeafHash);
        if (!leaf) {
            throw new Error('Leaf not found');
        }

        await this.updateNodeHash(leaf, newLeafHash);
    }

    /**
     * Update node hash and propagate changes
     * Following the exact Rust logic
     */
    async updateNodeHash(node: Node, newHash: Buffer): Promise<void> {
        if (!node.nodeHashToRemoveFromDb) {
            node.nodeHashToRemoveFromDb = Buffer.from(node.hash);
        }

        const oldHash = Buffer.from(node.hash);
        node.hash = Buffer.from(newHash);

        // Update hanging nodes
        for (const [level, hash] of this.hangingNodes) {
            if (Buffer.compare(hash, oldHash) === 0) {
                this.hangingNodes.set(level, node.hash);
                break;
            }
        }

        // Update cache
        const oldHashStr = oldHash.toString('hex');
        const newHashStr = node.hash.toString('hex');
        this.nodesCache.delete(oldHashStr);
        this.nodesCache.set(newHashStr, node);

        // Handle different node types
        const isLeaf = !node.left && !node.right;
        const isRoot = !node.parent;

        // If this is the root node, update the root hash
        if (isRoot) {
            this.rootHash = node.hash;

            // Update children's parent references
            if (node.left) {
                const leftNode = await this.getNodeByHash(node.left);
                if (leftNode) {
                    leftNode.setParentNodeHash(node.hash);
                    this.updateNodeInCache(leftNode);
                }
            }

            if (node.right) {
                const rightNode = await this.getNodeByHash(node.right);
                if (rightNode) {
                    rightNode.setParentNodeHash(node.hash);
                    this.updateNodeInCache(rightNode);
                }
            }
        }

        // If this is a leaf node with a parent, update the parent
        if (isLeaf && !isRoot) {
            if (node.parent) {
                const parentNode = await this.getNodeByHash(node.parent);
                if (parentNode) {
                    parentNode.updateLeaf(oldHash, node.hash);
                    const newParentHash = parentNode.calculateHash();
                    await this.updateNodeHash(parentNode, newParentHash);
                }
            }
        }
        // If this is an internal node with a parent, update the parent and children
        else if (!isLeaf && !isRoot) {
            // Update children's parent references
            if (node.left) {
                const leftNode = await this.getNodeByHash(node.left);
                if (leftNode) {
                    leftNode.setParentNodeHash(node.hash);
                    this.updateNodeInCache(leftNode);
                }
            }
            if (node.right) {
                const rightNode = await this.getNodeByHash(node.right);
                if (rightNode) {
                    rightNode.setParentNodeHash(node.hash);
                    this.updateNodeInCache(rightNode);
                }
            }

            // Update parent
            if (node.parent) {
                const parentNode = await this.getNodeByHash(node.parent);
                if (parentNode) {
                    parentNode.updateLeaf(oldHash, node.hash);
                    const newParentHash = parentNode.calculateHash();
                    await this.updateNodeHash(parentNode, newParentHash);
                }
            }
        }
    }

    /**
     * Get node by hash from cache or RocksDB
     */
    async getNodeByHash(hash: Buffer): Promise<Node | null> {
        if (!hash || hash.length === 0) {
            return null;
        }

        const hashStr = hash.toString('hex');
        let node = this.nodesCache.get(hashStr);
        
        if (!node) {
            const nodeKey = `nodes:${hashStr}`;
            const encodedData = await this.safeGet(nodeKey);
            
            if (!encodedData) {
                return null;
            }
            
            node = Node.decode(encodedData);
            this.nodesCache.set(hashStr, node);
        }

        return node;
    }

    /**
     * Update node in cache
     */
    updateNodeInCache(node: Node): void {
        const hashStr = node.hash.toString('hex');
        this.nodesCache.set(hashStr, node);
    }

    /**
     * Calculate leaf hash from key and data
     */
    calculateLeafHash(key: Buffer, data: Buffer): Buffer {
        return Keccac256.hash256(key, data);
    }

    /**
     * Revert unsaved changes
     */
    async revertUnsavedChanges(): Promise<void> {
        if (!this.hasUnsavedChanges) return;
        await this.ensureInitialized();
        this.errorIfClosed();

        this.nodesCache.clear();
        this.hangingNodes.clear();
        this.keyDataCache.clear();

        await this.loadMetaData();
        this.hasUnsavedChanges = false;
    }

    /**
     * Check if tree contains a key
     */
    async containsKey(key: Buffer): Promise<boolean> {
        await this.ensureInitialized();
        this.errorIfClosed();
        if (!key || key.length === 0) {
            throw new Error('Key cannot be empty');
        }

        const data = await this.getData(key);
        return data !== null;
    }

    /**
     * Flush all in-memory changes to RocksDB
     */
    async flushToDisk(): Promise<void> {
        if (!this.hasUnsavedChanges) return;

        await this.ensureInitialized();
        this.errorIfClosed();

        try {
            // Use batch for atomic writes
            const batch = this.db.batch();

            // Save metadata
            if (this.rootHash) {
                batch.put(MerkleTreeService.KEY_ROOT_HASH, this.rootHash);
            }
            
            const numLeavesBuffer = Buffer.allocUnsafe(4);
            numLeavesBuffer.writeInt32LE(this.numLeaves, 0);
            batch.put(MerkleTreeService.KEY_NUM_LEAVES, numLeavesBuffer);

            const depthBuffer = Buffer.allocUnsafe(4);
            depthBuffer.writeInt32LE(this.depth, 0);
            batch.put(MerkleTreeService.KEY_DEPTH, depthBuffer);

            // Save hanging nodes
            for (const [level, nodeHash] of this.hangingNodes) {
                batch.put(`${MerkleTreeService.KEY_HANGING_NODE_PREFIX}${level}`, nodeHash);
            }

            // Save nodes
            for (const node of this.nodesCache.values()) {
                const nodeKey = `nodes:${node.hash.toString('hex')}`;
                batch.put(nodeKey, node.encode());

                if (node.nodeHashToRemoveFromDb) {
                    const oldNodeKey = `nodes:${node.nodeHashToRemoveFromDb.toString('hex')}`;
                    batch.del(oldNodeKey);
                }
            }

            // Save key data
            for (const [keyStr, data] of this.keyDataCache) {
                const keyDataKey = `keyData:${keyStr}`;
                batch.put(keyDataKey, data);
            }

            // Write batch atomically
            await new Promise<void>((resolve, reject) => {
                batch.write((err: Error | null) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            // Clear caches but keep hanging nodes and metadata
            this.nodesCache.clear();
            this.keyDataCache.clear();
            this.hasUnsavedChanges = false;

            console.log(`Flushed changes to disk for tree: ${this.treeName}`);
        } catch (error) {
            console.error('Error flushing to disk:', error);
            throw error;
        }
    }

    /**
     * Close the tree
     */
    async close(): Promise<void> {
        if (this.closed) return;

        await this.ensureInitialized();
        await this.flushToDisk();
        
        return new Promise<void>((resolve, reject) => {
            this.db.close((err: Error | null) => {
                if (err) {
                    console.error('Error closing RocksDB:', err);
                    reject(err);
                } else {
                    MerkleTreeService.openTrees.delete(this.treeName);
                    this.closed = true;
                    console.log(`Closed tree: ${this.treeName}`);
                    resolve();
                }
            });
        });
    }

    /**
     * Clear the entire tree
     */
    async clear(): Promise<void> {
        await this.ensureInitialized();
        this.errorIfClosed();

        try {
            // Get all keys and delete them
            const allKeys = await this.getAllKeys();
            const batch = this.db.batch();
            
            allKeys.forEach(key => {
                batch.del(key);
            });

            await new Promise<void>((resolve, reject) => {
                batch.write((err: Error | null) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            // Reset in-memory state
            this.nodesCache.clear();
            this.keyDataCache.clear();
            this.hangingNodes.clear();
            this.rootHash = null;
            this.numLeaves = 0;
            this.depth = 0;
            this.hasUnsavedChanges = false;

            console.log(`Cleared tree: ${this.treeName}`);
        } catch (error) {
            console.error('Error clearing tree:', error);
            throw error;
        }
    }

    // Private methods

    /**
     * Get all keys from RocksDB
     */
    async getAllKeys(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const keys: string[] = [];
            const iterator = this.db.iterator();
            
            const iterateNext = () => {
                iterator.next((err: Error | null, key: Buffer | undefined, value: Buffer | undefined) => {
                    if (err) {
                        iterator.end(() => reject(err));
                        return;
                    }
                    
                    if (key === undefined) {
                        // End of iteration
                        iterator.end(() => resolve(keys));
                        return;
                    }
                    
                    keys.push(key.toString());
                    iterateNext();
                });
            };
            
            iterateNext();
        });
    }

    /**
     * Safe get operation that handles NotFound errors
     */
    async safeGet(key: string): Promise<Buffer | null> {
        return new Promise((resolve) => {
            this.db.get(key, (err: Error | null, value: Buffer | undefined) => {
                if (err || !value) {
                    resolve(null);
                } else {
                    resolve(value);
                }
            });
        });
    }

    /**
     * Load metadata from RocksDB
     */
    async loadMetaData(): Promise<void> {
        try {
            // Load root hash
            this.rootHash = await this.safeGet(MerkleTreeService.KEY_ROOT_HASH);

            // Load number of leaves
            const numLeavesBytes = await this.safeGet(MerkleTreeService.KEY_NUM_LEAVES);
            this.numLeaves = numLeavesBytes ? numLeavesBytes.readInt32LE(0) : 0;

            // Load depth
            const depthBytes = await this.safeGet(MerkleTreeService.KEY_DEPTH);
            this.depth = depthBytes ? depthBytes.readInt32LE(0) : 0;

            // Load hanging nodes
            this.hangingNodes.clear();
            for (let i = 0; i <= this.depth; i++) {
                const hash = await this.safeGet(`${MerkleTreeService.KEY_HANGING_NODE_PREFIX}${i}`);
                
                if (hash) {
                    this.hangingNodes.set(i, hash);
                }
            }
        } catch (error) {
            console.error('Error loading metadata:', error);
            // Initialize with defaults
            this.rootHash = null;
            this.numLeaves = 0;
            this.depth = 0;
            this.hangingNodes.clear();
            console.log(`Initialized empty tree: ${this.treeName}`);
        }
    }

    /**
     * Check if tree is closed
     */
    errorIfClosed(): void {
        if (this.closed) {
            throw new Error('MerkleTreeService is closed');
        }
    }
}

/**
 * Node class representing a single node in the Merkle Tree
 * Following the exact Rust Node implementation
 */
class Node {
    hash: Buffer;
    left: Buffer | null;
    right: Buffer | null;
    parent: Buffer | null;
    nodeHashToRemoveFromDb: Buffer | null;

    constructor(hash: Buffer, left: Buffer | null = null, right: Buffer | null = null, parent: Buffer | null = null) {
        if (!hash || hash.length === 0) {
            throw new Error('Node hash cannot be empty');
        }

        this.hash = Buffer.from(hash);
        this.left = left ? Buffer.from(left) : null;
        this.right = right ? Buffer.from(right) : null;
        this.parent = parent ? Buffer.from(parent) : null;
        this.nodeHashToRemoveFromDb = null;
    }

    /**
     * Construct a leaf node with a known hash
     */
    static newLeaf(hash: Buffer): Node {
        if (!hash || hash.length === 0) {
            throw new Error('Node hash cannot be empty');
        }
        return new Node(hash);
    }

    /**
     * Construct a node with all fields
     */
    static newWithFields(hash: Buffer, left: Buffer | null, right: Buffer | null, parent: Buffer | null): Node {
        if (!hash || hash.length === 0) {
            throw new Error('Node hash cannot be empty');
        }
        return new Node(hash, left, right, parent);
    }

    /**
     * Construct a node (non-leaf) with left and right hashes, auto-calculate node hash
     */
    static newInternal(left: Buffer | null, right: Buffer | null): Node {
        if (!left && !right) {
            throw new Error('At least one of left or right hash must be non-null');
        }

        const hash = this.calculateHashStatic(left, right);
        const node = new Node(hash, left, right);
        return node;
    }

    /**
     * Calculate hash based on left and right child hashes
     */
    static calculateHashStatic(left: Buffer | null, right: Buffer | null): Buffer {
        if (!left && !right) {
            throw new Error('Cannot calculate hash with no children');
        }

        const leftHash = left || right!;
        const rightHash = right || left!;

        return Keccac256.hash256(leftHash, rightHash);
    }

    /**
     * Calculate hash from current left and right children
     */
    calculateHash(): Buffer {
        return Node.calculateHashStatic(this.left, this.right);
    }

    /**
     * Encode the node into bytes for storage
     */
    encode(): Buffer {
        const hasLeft = this.left !== null;
        const hasRight = this.right !== null;
        const hasParent = this.parent !== null;

        const length = MerkleTreeService.HASH_LENGTH + 3 + 
                      (hasLeft ? MerkleTreeService.HASH_LENGTH : 0) +
                      (hasRight ? MerkleTreeService.HASH_LENGTH : 0) +
                      (hasParent ? MerkleTreeService.HASH_LENGTH : 0);

        const buffer = Buffer.allocUnsafe(length);
        let offset = 0;

        // Write hash
        this.hash.copy(buffer, offset);
        offset += MerkleTreeService.HASH_LENGTH;

        // Write flags
        buffer[offset++] = hasLeft ? 1 : 0;
        buffer[offset++] = hasRight ? 1 : 0;
        buffer[offset++] = hasParent ? 1 : 0;

        // Write hashes
        if (hasLeft && this.left) {
            this.left.copy(buffer, offset);
            offset += MerkleTreeService.HASH_LENGTH;
        }
        if (hasRight && this.right) {
            this.right.copy(buffer, offset);
            offset += MerkleTreeService.HASH_LENGTH;
        }
        if (hasParent && this.parent) {
            this.parent.copy(buffer, offset);
            offset += MerkleTreeService.HASH_LENGTH;
        }

        return buffer;
    }

    /**
     * Decode a node from bytes
     */
    static decode(data: Buffer): Node {
        const buffer = Buffer.from(data);
        
        if (buffer.length < MerkleTreeService.HASH_LENGTH + 3) {
            throw new Error('Invalid encoded data length');
        }

        let offset = 0;

        // Read hash
        const hash = buffer.slice(offset, offset + MerkleTreeService.HASH_LENGTH);
        offset += MerkleTreeService.HASH_LENGTH;

        // Read flags
        const hasLeft = buffer[offset++] === 1;
        const hasRight = buffer[offset++] === 1;
        const hasParent = buffer[offset++] === 1;

        // Read optional fields
        const left = hasLeft ? buffer.slice(offset, offset + MerkleTreeService.HASH_LENGTH) : null;
        if (hasLeft) offset += MerkleTreeService.HASH_LENGTH;

        const right = hasRight ? buffer.slice(offset, offset + MerkleTreeService.HASH_LENGTH) : null;
        if (hasRight) offset += MerkleTreeService.HASH_LENGTH;

        const parent = hasParent ? buffer.slice(offset, offset + MerkleTreeService.HASH_LENGTH) : null;

        return new Node(hash, left, right, parent);
    }

    /**
     * Set parent node hash
     */
    setParentNodeHash(parentHash: Buffer | null): void {
        this.parent = parentHash ? Buffer.from(parentHash) : null;
    }

    /**
     * Update a leaf hash
     */
    updateLeaf(oldLeafHash: Buffer, newLeafHash: Buffer): void {
        if (this.left && Buffer.compare(this.left, oldLeafHash) === 0) {
            this.left = Buffer.from(newLeafHash);
            return;
        }

        if (this.right && Buffer.compare(this.right, oldLeafHash) === 0) {
            this.right = Buffer.from(newLeafHash);
            return;
        }

        throw new Error('Old hash not found among this node\'s children');
    }

    /**
     * Add a leaf to this node
     */
    addLeaf(leafHash: Buffer): void {
        if (!this.left) {
            this.left = Buffer.from(leafHash);
        } else if (!this.right) {
            this.right = Buffer.from(leafHash);
        } else {
            throw new Error('Node already has both left and right children');
        }
    }
}
