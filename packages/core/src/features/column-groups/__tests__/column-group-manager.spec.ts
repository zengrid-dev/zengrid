/**
 * ColumnGroupManager Tests
 * Comprehensive tests for the column group manager with event-driven updates
 */

import { ColumnGroupManager } from '../column-group-manager';
import { ColumnGroupModel } from '../column-group-model';
import { ColumnGroupRenderer } from '../column-group-renderer';
import { ColumnGroup } from '../types';

describe('ColumnGroupManager', () => {
  let manager: ColumnGroupManager;

  beforeEach(() => {
    manager = new ColumnGroupManager();
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('Constructor and Initialization', () => {
    it('should create a manager with default options', () => {
      expect(manager).toBeInstanceOf(ColumnGroupManager);
      expect(manager.getModel()).toBeInstanceOf(ColumnGroupModel);
    });

    it('should create a manager with custom model config', () => {
      const customManager = new ColumnGroupManager({
        modelConfig: {
          maxDepth: 5,
          autoCalculateLevels: false,
          validateHierarchy: false,
        },
      });

      expect(customManager.getModel()).toBeDefined();
      customManager.destroy();
    });

    it('should create a manager with custom renderer config', () => {
      const customManager = new ColumnGroupManager({
        rendererConfig: {
          expandedIcon: '▼',
          collapsedIcon: '▶',
          showChildCount: true,
        },
      });

      expect(customManager.getRenderer()).toBeInstanceOf(ColumnGroupRenderer);
      customManager.destroy();
    });

    it('should support autoRender option', () => {
      const customManager = new ColumnGroupManager({
        autoRender: false,
      });

      expect(customManager).toBeDefined();
      customManager.destroy();
    });
  });

  describe('Group Operations', () => {
    const createTestGroup = (id: string, parentId: string | null = null): ColumnGroup => ({
      groupId: id,
      headerName: `Group ${id}`,
      parentGroupId: parentId,
      children: [],
      columnFields: [],
      expanded: true,
    });

    describe('addGroup', () => {
      it('should add a group successfully', () => {
        const group = createTestGroup('g1');
        manager.addGroup(group);

        const retrieved = manager.getGroup('g1');
        expect(retrieved).toBeDefined();
        expect(retrieved?.groupId).toBe('g1');
      });

      it('should emit groupAdded event when adding a group', (done) => {
        const group = createTestGroup('g1');

        manager.on('groupAdded', (event) => {
          expect(event.group.groupId).toBe('g1');
          expect(event.timestamp).toBeGreaterThan(0);
          done();
        });

        manager.addGroup(group);
      });

      it('should emit hierarchyChanged event when adding a group', (done) => {
        const group = createTestGroup('g1');

        manager.on('hierarchyChanged', (event) => {
          expect(event.affectedGroupIds).toContain('g1');
          expect(event.timestamp).toBeGreaterThan(0);
          done();
        });

        manager.addGroup(group);
      });

      it('should throw error for invalid group when validation is enabled', () => {
        const invalidGroup: ColumnGroup = {
          groupId: '',
          headerName: 'Invalid',
          parentGroupId: null,
          children: [],
          columnFields: [],
        };

        expect(() => manager.addGroup(invalidGroup)).toThrow();
      });

      it('should add multiple groups in hierarchy', () => {
        const parent = createTestGroup('parent');
        const child = createTestGroup('child', 'parent');

        manager.addGroup(parent);
        manager.addGroup(child);

        expect(manager.getGroup('parent')).toBeDefined();
        expect(manager.getGroup('child')).toBeDefined();
        expect(manager.getChildGroups('parent')).toHaveLength(1);
      });
    });

    describe('removeGroup', () => {
      it('should remove a group successfully', () => {
        const group = createTestGroup('g1');
        manager.addGroup(group);

        manager.removeGroup('g1');
        expect(manager.getGroup('g1')).toBeUndefined();
      });

      it('should emit groupRemoved event when removing a group', (done) => {
        const group = createTestGroup('g1');
        manager.addGroup(group);

        manager.on('groupRemoved', (event) => {
          expect(event.groupId).toBe('g1');
          expect(event.group.groupId).toBe('g1');
          expect(event.timestamp).toBeGreaterThan(0);
          done();
        });

        manager.removeGroup('g1');
      });

      it('should emit hierarchyChanged event when removing a group', (done) => {
        const group = createTestGroup('g1');
        manager.addGroup(group);

        // Subscribe after adding to only catch the removeGroup event
        manager.on('hierarchyChanged', (event) => {
          expect(event.affectedGroupIds).toContain('g1');
          expect(event.timestamp).toBeGreaterThan(0);
          done();
        });

        manager.removeGroup('g1');
      });

      it('should handle removing non-existent group gracefully', () => {
        expect(() => manager.removeGroup('nonexistent')).not.toThrow();
      });

      it('should remove group with children when removeChildren is true', () => {
        const parent = createTestGroup('parent');
        const child1 = createTestGroup('child1', 'parent');
        const child2 = createTestGroup('child2', 'parent');

        manager.addGroup(parent);
        manager.addGroup(child1);
        manager.addGroup(child2);

        manager.removeGroup('parent', true);

        expect(manager.getGroup('parent')).toBeUndefined();
        expect(manager.getGroup('child1')).toBeUndefined();
        expect(manager.getGroup('child2')).toBeUndefined();
      });

      it('should re-parent children when removeChildren is false', () => {
        const parent = createTestGroup('parent');
        const child = createTestGroup('child', 'parent');

        manager.addGroup(parent);
        manager.addGroup(child);

        manager.removeGroup('parent', false);

        expect(manager.getGroup('parent')).toBeUndefined();
        expect(manager.getGroup('child')).toBeDefined();
        expect(manager.getGroup('child')?.parentGroupId).toBeNull();
      });
    });

    describe('updateGroup', () => {
      it('should update a group successfully', () => {
        const group = createTestGroup('g1');
        manager.addGroup(group);

        manager.updateGroup('g1', { headerName: 'Updated Group' });

        const updated = manager.getGroup('g1');
        expect(updated?.headerName).toBe('Updated Group');
      });

      it('should emit groupUpdated event when updating a group', (done) => {
        const group = createTestGroup('g1');
        manager.addGroup(group);

        manager.on('groupUpdated', (event) => {
          expect(event.groupId).toBe('g1');
          expect(event.oldGroup.headerName).toBe('Group g1');
          expect(event.newGroup.headerName).toBe('Updated');
          expect(event.timestamp).toBeGreaterThan(0);
          done();
        });

        manager.updateGroup('g1', { headerName: 'Updated' });
      });

      it('should emit hierarchyChanged when parent changes', (done) => {
        const group1 = createTestGroup('g1');
        const group2 = createTestGroup('g2');
        manager.addGroup(group1);
        manager.addGroup(group2);

        // Subscribe after adding groups to only catch the updateGroup event
        manager.on('hierarchyChanged', (event) => {
          expect(event.affectedGroupIds).toContain('g2');
          expect(event.timestamp).toBeGreaterThan(0);
          done();
        });

        manager.updateGroup('g2', { parentGroupId: 'g1' });
      });

      it('should throw error when updating non-existent group', () => {
        expect(() => manager.updateGroup('nonexistent', { headerName: 'Test' })).toThrow();
      });

      it('should allow multiple property updates', () => {
        const group = createTestGroup('g1');
        manager.addGroup(group);

        manager.updateGroup('g1', {
          headerName: 'New Name',
          expanded: false,
          cssClasses: ['custom-class'],
        });

        const updated = manager.getGroup('g1');
        expect(updated?.headerName).toBe('New Name');
        expect(updated?.expanded).toBe(false);
        expect(updated?.cssClasses).toEqual(['custom-class']);
      });
    });

    describe('toggleGroup', () => {
      it('should expand a collapsed group', () => {
        const group: ColumnGroup = {
          ...createTestGroup('g1'),
          expanded: false,
        };
        manager.addGroup(group);

        manager.expandGroup('g1');

        expect(manager.isExpanded('g1')).toBe(true);
      });

      it('should collapse an expanded group', () => {
        const group = createTestGroup('g1');
        manager.addGroup(group);

        manager.collapseGroup('g1');

        expect(manager.isExpanded('g1')).toBe(false);
      });

      it('should toggle group expansion', () => {
        const group = createTestGroup('g1');
        manager.addGroup(group);

        const initialState = manager.isExpanded('g1');
        manager.toggleGroup('g1');

        expect(manager.isExpanded('g1')).toBe(!initialState);
      });

      it('should emit groupToggled event when expanding', (done) => {
        const group: ColumnGroup = {
          ...createTestGroup('g1'),
          expanded: false,
        };
        manager.addGroup(group);

        manager.on('groupToggled', (event) => {
          expect(event.groupId).toBe('g1');
          expect(event.expanded).toBe(true);
          expect(event.timestamp).toBeGreaterThan(0);
          done();
        });

        manager.expandGroup('g1');
      });

      it('should emit groupToggled event when collapsing', (done) => {
        const group = createTestGroup('g1');
        manager.addGroup(group);

        manager.on('groupToggled', (event) => {
          expect(event.groupId).toBe('g1');
          expect(event.expanded).toBe(false);
          expect(event.timestamp).toBeGreaterThan(0);
          done();
        });

        manager.collapseGroup('g1');
      });

      it('should handle toggling non-existent group gracefully', () => {
        expect(() => manager.toggleGroup('nonexistent')).not.toThrow();
      });
    });
  });

  describe('Query Methods', () => {
    beforeEach(() => {
      // Create a hierarchy: root -> child1, child2 -> grandchild
      const root = {
        groupId: 'root',
        headerName: 'Root',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };
      const child1 = {
        groupId: 'child1',
        headerName: 'Child 1',
        parentGroupId: 'root',
        children: [],
        columnFields: [],
      };
      const child2 = {
        groupId: 'child2',
        headerName: 'Child 2',
        parentGroupId: 'root',
        children: [],
        columnFields: [],
      };
      const grandchild = {
        groupId: 'grandchild',
        headerName: 'Grandchild',
        parentGroupId: 'child1',
        children: [],
        columnFields: [],
      };

      manager.addGroup(root);
      manager.addGroup(child1);
      manager.addGroup(child2);
      manager.addGroup(grandchild);
    });

    it('should get a group by ID', () => {
      const group = manager.getGroup('root');
      expect(group).toBeDefined();
      expect(group?.groupId).toBe('root');
    });

    it('should return undefined for non-existent group', () => {
      expect(manager.getGroup('nonexistent')).toBeUndefined();
    });

    it('should get all root groups', () => {
      const roots = manager.getRootGroups();
      expect(roots).toHaveLength(1);
      expect(roots[0].groupId).toBe('root');
    });

    it('should get all groups', () => {
      const all = manager.getAllGroups();
      expect(all).toHaveLength(4);
    });

    it('should get child groups', () => {
      const children = manager.getChildGroups('root');
      expect(children).toHaveLength(2);
      expect(children.map((c) => c.groupId)).toContain('child1');
      expect(children.map((c) => c.groupId)).toContain('child2');
    });

    it('should get descendant groups recursively', () => {
      const descendants = manager.getDescendantGroups('root');
      expect(descendants.length).toBeGreaterThanOrEqual(2);
      expect(descendants.map((d) => d.groupId)).toContain('child1');
      expect(descendants.map((d) => d.groupId)).toContain('child2');
    });

    it('should get ancestor groups', () => {
      const ancestors = manager.getAncestorGroups('grandchild');
      expect(ancestors).toHaveLength(2);
      expect(ancestors[0].groupId).toBe('child1');
      expect(ancestors[1].groupId).toBe('root');
    });

    it('should build hierarchy tree', () => {
      const tree = manager.buildHierarchyTree();
      expect(tree).toHaveLength(1);
      expect(tree[0].group.groupId).toBe('root');
      expect(tree[0].children).toHaveLength(2);
    });
  });

  describe('Event Subscriptions', () => {
    it('should subscribe to events with on()', (done) => {
      const group = {
        groupId: 'g1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      manager.on('groupAdded', (event) => {
        expect(event.group.groupId).toBe('g1');
        done();
      });

      manager.addGroup(group);
    });

    it('should unsubscribe with returned function', () => {
      const group = {
        groupId: 'g1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      let callCount = 0;
      const unsubscribe = manager.on('groupAdded', () => {
        callCount++;
      });

      manager.addGroup(group);
      unsubscribe();

      const group2 = {
        groupId: 'g2',
        headerName: 'Group 2',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };
      manager.addGroup(group2);

      expect(callCount).toBe(1);
    });

    it('should subscribe once with once()', () => {
      const group1 = {
        groupId: 'g1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };
      const group2 = {
        groupId: 'g2',
        headerName: 'Group 2',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      let callCount = 0;
      manager.once('groupAdded', () => {
        callCount++;
      });

      manager.addGroup(group1);
      manager.addGroup(group2);

      expect(callCount).toBe(1);
    });

    it('should unsubscribe with off()', () => {
      const group1 = {
        groupId: 'g1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };
      const group2 = {
        groupId: 'g2',
        headerName: 'Group 2',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      let callCount = 0;
      const listener = () => {
        callCount++;
      };

      manager.on('groupAdded', listener);
      manager.addGroup(group1);

      manager.off('groupAdded', listener);
      manager.addGroup(group2);

      expect(callCount).toBe(1);
    });

    it('should remove all listeners with removeAllListeners()', () => {
      const group = {
        groupId: 'g1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      let callCount = 0;
      manager.on('groupAdded', () => callCount++);
      manager.on('groupRemoved', () => callCount++);

      manager.removeAllListeners();

      manager.addGroup(group);
      manager.removeGroup('g1');

      expect(callCount).toBe(0);
    });

    it('should remove listeners for specific event', () => {
      const group = {
        groupId: 'g1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      let addedCount = 0;
      let removedCount = 0;

      manager.on('groupAdded', () => addedCount++);
      manager.on('groupRemoved', () => removedCount++);

      manager.removeAllListeners('groupAdded');

      manager.addGroup(group);
      manager.removeGroup('g1');

      expect(addedCount).toBe(0);
      expect(removedCount).toBe(1);
    });
  });

  describe('Validation', () => {
    it('should validate a group', () => {
      const validGroup = {
        groupId: 'g1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const result = manager.validateGroup(validGroup);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate hierarchy', () => {
      const group1 = {
        groupId: 'g1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };
      const group2 = {
        groupId: 'g2',
        headerName: 'Group 2',
        parentGroupId: 'g1',
        children: [],
        columnFields: [],
      };

      manager.addGroup(group1);
      manager.addGroup(group2);

      const result = manager.validateHierarchy();
      expect(result.valid).toBe(true);
    });
  });

  describe('Rendering', () => {
    it('should render a group with renderer', () => {
      const group = {
        groupId: 'g1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };
      manager.addGroup(group);

      const element = document.createElement('div');
      manager.renderGroup(element, 'g1');

      expect(element.children.length).toBeGreaterThan(0);
    });

    it('should render multiple groups', () => {
      const group1 = {
        groupId: 'g1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };
      const group2 = {
        groupId: 'g2',
        headerName: 'Group 2',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      manager.addGroup(group1);
      manager.addGroup(group2);

      const element = document.createElement('div');
      manager.renderGroups(element, ['g1', 'g2']);

      expect(element.children.length).toBeGreaterThan(0);
    });

    it('should throw error when rendering without renderer', () => {
      const customManager = new ColumnGroupManager({
        rendererConfig: undefined,
      });

      const group = {
        groupId: 'g1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };
      customManager.addGroup(group);

      // Set renderer to null explicitly
      customManager.setRenderer(null);

      const element = document.createElement('div');
      expect(() => customManager.renderGroup(element, 'g1')).toThrow();

      customManager.destroy();
    });

    it('should throw error when rendering non-existent group', () => {
      const element = document.createElement('div');
      expect(() => manager.renderGroup(element, 'nonexistent')).toThrow();
    });

    it('should support custom toggle handler', () => {
      const group = {
        groupId: 'g1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: true,
      };
      manager.addGroup(group);

      const customToggle = () => {
        /* no-op */
      };

      const element = document.createElement('div');
      manager.renderGroup(element, 'g1', customToggle);

      expect(element.children.length).toBeGreaterThan(0);
    });
  });

  describe('Renderer Management', () => {
    it('should get renderer', () => {
      const renderer = manager.getRenderer();
      expect(renderer).toBeInstanceOf(ColumnGroupRenderer);
    });

    it('should set custom renderer', () => {
      const customRenderer = new ColumnGroupRenderer();
      manager.setRenderer(customRenderer);

      expect(manager.getRenderer()).toBe(customRenderer);

      customRenderer.destroy();
    });

    it('should cleanup old renderer when setting new one', () => {
      const oldRenderer = manager.getRenderer();
      const destroySpy = jest.spyOn(oldRenderer!, 'destroy');

      const newRenderer = new ColumnGroupRenderer();
      manager.setRenderer(newRenderer);

      expect(destroySpy).toHaveBeenCalled();

      newRenderer.destroy();
    });

    it('should handle setting null renderer', () => {
      manager.setRenderer(null);
      expect(manager.getRenderer()).toBeNull();
    });
  });

  describe('Memory Cleanup', () => {
    it('should cleanup resources on destroy', () => {
      const group = {
        groupId: 'g1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      let callCount = 0;
      manager.on('groupAdded', () => callCount++);

      manager.addGroup(group);
      expect(callCount).toBe(1);

      manager.destroy();

      // After destroy, events should not fire
      const group2 = {
        groupId: 'g2',
        headerName: 'Group 2',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      // This will still work but no events should fire
      try {
        manager.addGroup(group2);
      } catch {
        // Expected to potentially fail after destroy
      }

      expect(callCount).toBe(1);
    });

    it('should cleanup renderer on destroy', () => {
      const renderer = manager.getRenderer();
      const destroySpy = jest.spyOn(renderer!, 'destroy');

      manager.destroy();

      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('Integration with Model', () => {
    it('should get model instance', () => {
      const model = manager.getModel();
      expect(model).toBeInstanceOf(ColumnGroupModel);
    });

    it('should synchronize with model operations', () => {
      const group = {
        groupId: 'g1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      manager.addGroup(group);

      const modelGroup = manager.getModel().getGroup('g1');
      expect(modelGroup).toBeDefined();
      expect(modelGroup?.groupId).toBe('g1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid add/remove operations', () => {
      for (let i = 0; i < 100; i++) {
        const group = {
          groupId: `g${i}`,
          headerName: `Group ${i}`,
          parentGroupId: null,
          children: [],
          columnFields: [],
        };
        manager.addGroup(group);
      }

      for (let i = 0; i < 100; i++) {
        manager.removeGroup(`g${i}`);
      }

      expect(manager.getAllGroups()).toHaveLength(0);
    });

    it('should handle complex hierarchy operations', () => {
      const root = {
        groupId: 'root',
        headerName: 'Root',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };
      manager.addGroup(root);

      for (let i = 0; i < 10; i++) {
        const child = {
          groupId: `child${i}`,
          headerName: `Child ${i}`,
          parentGroupId: 'root',
          children: [],
          columnFields: [],
        };
        manager.addGroup(child);
      }

      const children = manager.getChildGroups('root');
      expect(children).toHaveLength(10);

      manager.removeGroup('root', true);
      expect(manager.getAllGroups()).toHaveLength(0);
    });

    it('should handle multiple event listeners', () => {
      const group = {
        groupId: 'g1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      let count1 = 0;
      let count2 = 0;
      let count3 = 0;

      manager.on('groupAdded', () => count1++);
      manager.on('groupAdded', () => count2++);
      manager.on('groupAdded', () => count3++);

      manager.addGroup(group);

      expect(count1).toBe(1);
      expect(count2).toBe(1);
      expect(count3).toBe(1);
    });
  });
});
