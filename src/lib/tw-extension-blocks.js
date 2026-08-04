import {CORE_CATEGORY_IDS} from './make-toolbox-xml';

// Clones share the same underlying Sprite (and therefore the same blocks) as their original.
// Only original targets need to be scanned/edited to cover every block in the project once.
const isOriginalTarget = target => (
    !Object.prototype.hasOwnProperty.call(target, 'isOriginal') || target.isOriginal
);

/**
 * @param {VirtualMachine} vm the VM
 * @returns {Array<string>} the IDs of the extensions that currently have a category in the toolbox
 * and can be removed (ie. everything except Scratch's built-in categories).
 */
const getRemovableExtensionIds = vm => (
    vm.runtime._blockInfo
        .map(categoryInfo => categoryInfo.id)
        .filter(id => !CORE_CATEGORY_IDS.includes(id))
);

/**
 * @param {VirtualMachine} vm the VM
 * @param {string} extensionId the extension's ID
 * @returns {number} the number of blocks anywhere in the project that belong to this extension
 */
const countExtensionBlocks = (vm, extensionId) => {
    const prefix = `${extensionId}_`;
    let count = 0;
    for (const target of vm.runtime.targets) {
        if (!isOriginalTarget(target)) continue;
        const blocks = target.blocks._blocks;
        for (const id in blocks) {
            if (blocks[id].opcode && blocks[id].opcode.startsWith(prefix)) {
                count++;
            }
        }
    }
    return count;
};

/**
 * Remove a single block from a target's blocks, healing the surrounding stack/input
 * so the rest of the script stays valid, then delete the block and everything nested inside it.
 * @param {Blocks} blocks the target's Blocks container
 * @param {string} blockId the ID of the block to remove
 */
const deleteBlockWithHealing = (blocks, blockId) => {
    const block = blocks.getBlock(blockId);
    if (!block) return;

    const nextId = block.next;
    const parentId = block.parent;

    if (parentId !== null && typeof parentId !== 'undefined') {
        const parent = blocks.getBlock(parentId);
        if (parent) {
            if (parent.next === blockId) {
                parent.next = nextId;
            } else {
                for (const inputName in parent.inputs) {
                    const input = parent.inputs[inputName];
                    if (input.block === blockId) {
                        // Restore the input's default shadow block if there is one, otherwise
                        // reconnect whatever followed this block (eg. the rest of a substack).
                        input.block = (input.shadow && input.shadow !== blockId) ? input.shadow : nextId;
                    }
                }
            }
        }
        if (nextId) {
            const nextBlock = blocks.getBlock(nextId);
            if (nextBlock) {
                nextBlock.parent = parentId;
            }
        }
    } else if (nextId) {
        // This was a top-level block; the next block in the stack takes its place.
        const nextBlock = blocks.getBlock(nextId);
        if (nextBlock) {
            nextBlock.parent = null;
            nextBlock.topLevel = true;
            nextBlock.x = block.x;
            nextBlock.y = block.y;
        }
    }

    // Prevent Blocks#deleteBlock's own recursion from cascading into the sibling we just healed.
    block.next = null;
    blocks.deleteBlock(blockId);
};

/**
 * Delete every block belonging to an extension, in every sprite and the stage.
 * @param {VirtualMachine} vm the VM
 * @param {string} extensionId the extension's ID
 */
const removeExtensionBlocks = (vm, extensionId) => {
    const prefix = `${extensionId}_`;
    for (const target of vm.runtime.targets) {
        if (!isOriginalTarget(target)) continue;
        const blocks = target.blocks;
        const matchingIds = Object.keys(blocks._blocks).filter(
            id => blocks._blocks[id].opcode && blocks._blocks[id].opcode.startsWith(prefix)
        );
        for (const id of matchingIds) {
            vm.runtime.requestRemoveMonitor(id);
            deleteBlockWithHealing(blocks, id);
        }
    }
};

/**
 * Forget that an extension was ever loaded: remove its toolbox category and registered
 * blocks/hats so the runtime and toolbox no longer know about it.
 * @param {VirtualMachine} vm the VM
 * @param {string} extensionId the extension's ID
 */
const unregisterExtension = (vm, extensionId) => {
    const runtime = vm.runtime;
    const prefix = `${extensionId}_`;

    const categoryIndex = runtime._blockInfo.findIndex(categoryInfo => categoryInfo.id === extensionId);
    if (categoryIndex !== -1) {
        runtime._blockInfo.splice(categoryIndex, 1);
    }

    for (const opcode of Object.keys(runtime._primitives)) {
        if (opcode.startsWith(prefix)) delete runtime._primitives[opcode];
    }
    for (const opcode of Object.keys(runtime._hats)) {
        if (opcode.startsWith(prefix)) delete runtime._hats[opcode];
    }
    for (const opcode of Object.keys(runtime._flowing)) {
        if (opcode.startsWith(prefix)) delete runtime._flowing[opcode];
    }

    vm.extensionManager._loadedExtensions.delete(extensionId);
};

/**
 * Remove an extension entirely: delete every block that uses it, then unload it so its
 * category disappears from the toolbox and it can be re-added later.
 * @param {VirtualMachine} vm the VM
 * @param {string} extensionId the extension's ID
 */
const removeExtension = (vm, extensionId) => {
    removeExtensionBlocks(vm, extensionId);
    unregisterExtension(vm, extensionId);
    vm.refreshWorkspace();
    vm.runtime.emitProjectChanged();
};

export {
    getRemovableExtensionIds,
    countExtensionBlocks,
    removeExtension
};
