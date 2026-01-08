/**
 * Tests for ColumnGroupModel
 */

import { ColumnGroupModel } from '../column-group-model';
import { ColumnGroup } from '../types';

describe('ColumnGroupModel', () => {
  let model: ColumnGroupModel;

  beforeEach(() => {
    model = new ColumnGroupModel();
  });

  describe('Basic Operations', () => {
    it('should add a root group', () => {
      const group: ColumnGroup = {
        groupId: 'group1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: ['field1', 'field2'],
      };

      model.addGroup(group);

      expect(model.size()).toBe(1);
      const retrieved = model.getGroup('group1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.headerName).toBe('Group 1');
    });

    it('should add a child group', () => {
      const parent: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const child: ColumnGroup = {
        groupId: 'child',
        headerName: 'Child',
        parentGroupId: 'parent',
        children: [],
        columnFields: ['field1'],
      };

      model.addGroup(parent);
      model.addGroup(child);

      expect(model.size()).toBe(2);
      const retrievedParent = model.getGroup('parent');
      expect(retrievedParent?.children).toContain('child');
    });

    it('should remove a group', () => {
      const group: ColumnGroup = {
        groupId: 'group1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      model.addGroup(group);
      expect(model.size()).toBe(1);

      model.removeGroup('group1');
      expect(model.size()).toBe(0);
      expect(model.getGroup('group1')).toBeUndefined();
    });

    it('should remove a group with children (re-parenting)', () => {
      const grandparent: ColumnGroup = {
        groupId: 'grandparent',
        headerName: 'Grandparent',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const parent: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent',
        parentGroupId: 'grandparent',
        children: [],
        columnFields: [],
      };

      const child: ColumnGroup = {
        groupId: 'child',
        headerName: 'Child',
        parentGroupId: 'parent',
        children: [],
        columnFields: [],
      };

      model.addGroup(grandparent);
      model.addGroup(parent);
      model.addGroup(child);

      // Remove parent (should re-parent child to grandparent)
      model.removeGroup('parent', false);

      expect(model.size()).toBe(2);
      const retrievedChild = model.getGroup('child');
      expect(retrievedChild?.parentGroupId).toBe('grandparent');
      const retrievedGrandparent = model.getGroup('grandparent');
      expect(retrievedGrandparent?.children).toContain('child');
    });

    it('should remove a group with children (cascade)', () => {
      const parent: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const child: ColumnGroup = {
        groupId: 'child',
        headerName: 'Child',
        parentGroupId: 'parent',
        children: [],
        columnFields: [],
      };

      model.addGroup(parent);
      model.addGroup(child);

      // Remove parent with cascade
      model.removeGroup('parent', true);

      expect(model.size()).toBe(0);
    });

    it('should update a group', () => {
      const group: ColumnGroup = {
        groupId: 'group1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      model.addGroup(group);
      model.updateGroup('group1', { headerName: 'Updated Group' });

      const updated = model.getGroup('group1');
      expect(updated?.headerName).toBe('Updated Group');
    });

    it('should update parent group', () => {
      const parent1: ColumnGroup = {
        groupId: 'parent1',
        headerName: 'Parent 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const parent2: ColumnGroup = {
        groupId: 'parent2',
        headerName: 'Parent 2',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const child: ColumnGroup = {
        groupId: 'child',
        headerName: 'Child',
        parentGroupId: 'parent1',
        children: [],
        columnFields: [],
      };

      model.addGroup(parent1);
      model.addGroup(parent2);
      model.addGroup(child);

      // Change parent
      model.updateGroup('child', { parentGroupId: 'parent2' });

      const updatedChild = model.getGroup('child');
      expect(updatedChild?.parentGroupId).toBe('parent2');

      const updatedParent1 = model.getGroup('parent1');
      expect(updatedParent1?.children).not.toContain('child');

      const updatedParent2 = model.getGroup('parent2');
      expect(updatedParent2?.children).toContain('child');
    });

    it('should get all groups', () => {
      const group1: ColumnGroup = {
        groupId: 'group1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const group2: ColumnGroup = {
        groupId: 'group2',
        headerName: 'Group 2',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      model.addGroup(group1);
      model.addGroup(group2);

      const allGroups = model.getAllGroups();
      expect(allGroups.length).toBe(2);
      expect(allGroups.map((g) => g.groupId)).toContain('group1');
      expect(allGroups.map((g) => g.groupId)).toContain('group2');
    });

    it('should clear all groups', () => {
      const group: ColumnGroup = {
        groupId: 'group1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      model.addGroup(group);
      expect(model.size()).toBe(1);

      model.clear();
      expect(model.size()).toBe(0);
    });
  });

  describe('Hierarchical Queries', () => {
    it('should get root groups', () => {
      const root1: ColumnGroup = {
        groupId: 'root1',
        headerName: 'Root 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const root2: ColumnGroup = {
        groupId: 'root2',
        headerName: 'Root 2',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const child: ColumnGroup = {
        groupId: 'child',
        headerName: 'Child',
        parentGroupId: 'root1',
        children: [],
        columnFields: [],
      };

      model.addGroup(root1);
      model.addGroup(root2);
      model.addGroup(child);

      const rootGroups = model.getRootGroups();
      expect(rootGroups.length).toBe(2);
      expect(rootGroups.map((g) => g.groupId)).toContain('root1');
      expect(rootGroups.map((g) => g.groupId)).toContain('root2');
    });

    it('should get child groups', () => {
      const parent: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const child1: ColumnGroup = {
        groupId: 'child1',
        headerName: 'Child 1',
        parentGroupId: 'parent',
        children: [],
        columnFields: [],
      };

      const child2: ColumnGroup = {
        groupId: 'child2',
        headerName: 'Child 2',
        parentGroupId: 'parent',
        children: [],
        columnFields: [],
      };

      model.addGroup(parent);
      model.addGroup(child1);
      model.addGroup(child2);

      const children = model.getChildGroups('parent');
      expect(children.length).toBe(2);
      expect(children.map((c) => c.groupId)).toContain('child1');
      expect(children.map((c) => c.groupId)).toContain('child2');
    });

    it('should get descendant groups', () => {
      const root: ColumnGroup = {
        groupId: 'root',
        headerName: 'Root',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const level1: ColumnGroup = {
        groupId: 'level1',
        headerName: 'Level 1',
        parentGroupId: 'root',
        children: [],
        columnFields: [],
      };

      const level2: ColumnGroup = {
        groupId: 'level2',
        headerName: 'Level 2',
        parentGroupId: 'level1',
        children: [],
        columnFields: [],
      };

      model.addGroup(root);
      model.addGroup(level1);
      model.addGroup(level2);

      const descendants = model.getDescendantGroups('root');
      expect(descendants.length).toBe(2);
      expect(descendants.map((d) => d.groupId)).toContain('level1');
      expect(descendants.map((d) => d.groupId)).toContain('level2');
    });

    it('should get ancestor groups', () => {
      const root: ColumnGroup = {
        groupId: 'root',
        headerName: 'Root',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const level1: ColumnGroup = {
        groupId: 'level1',
        headerName: 'Level 1',
        parentGroupId: 'root',
        children: [],
        columnFields: [],
      };

      const level2: ColumnGroup = {
        groupId: 'level2',
        headerName: 'Level 2',
        parentGroupId: 'level1',
        children: [],
        columnFields: [],
      };

      model.addGroup(root);
      model.addGroup(level1);
      model.addGroup(level2);

      const ancestors = model.getAncestorGroups('level2');
      expect(ancestors.length).toBe(2);
      expect(ancestors[0].groupId).toBe('level1');
      expect(ancestors[1].groupId).toBe('root');
    });
  });

  describe('Hierarchy Tree', () => {
    it('should build hierarchy tree', () => {
      const root: ColumnGroup = {
        groupId: 'root',
        headerName: 'Root',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const child: ColumnGroup = {
        groupId: 'child',
        headerName: 'Child',
        parentGroupId: 'root',
        children: [],
        columnFields: [],
      };

      model.addGroup(root);
      model.addGroup(child);

      const tree = model.buildHierarchyTree();
      expect(tree.length).toBe(1);
      expect(tree[0].group.groupId).toBe('root');
      expect(tree[0].children.length).toBe(1);
      expect(tree[0].children[0].group.groupId).toBe('child');
      expect(tree[0].depth).toBe(0);
      expect(tree[0].children[0].depth).toBe(1);
    });

    it('should build complex hierarchy tree', () => {
      const root1: ColumnGroup = {
        groupId: 'root1',
        headerName: 'Root 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const root2: ColumnGroup = {
        groupId: 'root2',
        headerName: 'Root 2',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const child1: ColumnGroup = {
        groupId: 'child1',
        headerName: 'Child 1',
        parentGroupId: 'root1',
        children: [],
        columnFields: [],
      };

      const grandchild: ColumnGroup = {
        groupId: 'grandchild',
        headerName: 'Grandchild',
        parentGroupId: 'child1',
        children: [],
        columnFields: [],
      };

      model.addGroup(root1);
      model.addGroup(root2);
      model.addGroup(child1);
      model.addGroup(grandchild);

      const tree = model.buildHierarchyTree();
      expect(tree.length).toBe(2);

      const root1Node = tree.find((n) => n.group.groupId === 'root1');
      expect(root1Node).toBeDefined();
      expect(root1Node!.children.length).toBe(1);
      expect(root1Node!.children[0].children.length).toBe(1);
      expect(root1Node!.children[0].children[0].group.groupId).toBe('grandchild');
    });
  });

  describe('Expansion State', () => {
    it('should expand a group', () => {
      const group: ColumnGroup = {
        groupId: 'group1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: false,
      };

      model.addGroup(group);
      model.expandGroup('group1');

      expect(model.isExpanded('group1')).toBe(true);
    });

    it('should collapse a group', () => {
      const group: ColumnGroup = {
        groupId: 'group1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: true,
      };

      model.addGroup(group);
      model.collapseGroup('group1');

      expect(model.isExpanded('group1')).toBe(false);
    });

    it('should toggle group expansion', () => {
      const group: ColumnGroup = {
        groupId: 'group1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: false,
      };

      model.addGroup(group);
      model.toggleGroup('group1');
      expect(model.isExpanded('group1')).toBe(true);

      model.toggleGroup('group1');
      expect(model.isExpanded('group1')).toBe(false);
    });

    it('should default to expanded if not specified', () => {
      const group: ColumnGroup = {
        groupId: 'group1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      model.addGroup(group);
      expect(model.isExpanded('group1')).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should validate a valid group', () => {
      const group: ColumnGroup = {
        groupId: 'group1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const result = model.validateGroup(group);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject group without groupId', () => {
      const group: ColumnGroup = {
        groupId: '',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const result = model.validateGroup(group);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('groupId is required');
    });

    it('should reject group without headerName', () => {
      const group: ColumnGroup = {
        groupId: 'group1',
        headerName: '',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const result = model.validateGroup(group);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('headerName is required');
    });

    it('should reject duplicate groupId', () => {
      const group1: ColumnGroup = {
        groupId: 'group1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      model.addGroup(group1);

      const group2: ColumnGroup = {
        groupId: 'group1',
        headerName: 'Group 1 Duplicate',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const result = model.validateGroup(group2);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Duplicate groupId: group1');
    });

    it('should reject group with non-existent parent', () => {
      const group: ColumnGroup = {
        groupId: 'child',
        headerName: 'Child',
        parentGroupId: 'nonexistent',
        children: [],
        columnFields: [],
      };

      const result = model.validateGroup(group);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Parent group not found: nonexistent');
    });

    it('should reject self-referencing group', () => {
      const group: ColumnGroup = {
        groupId: 'group1',
        headerName: 'Group 1',
        parentGroupId: 'group1',
        children: [],
        columnFields: [],
      };

      const result = model.validateGroup(group);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Group cannot be its own parent');
    });

    it('should reject group exceeding max depth', () => {
      const modelWithMaxDepth = new ColumnGroupModel({ maxDepth: 2 });

      const level0: ColumnGroup = {
        groupId: 'level0',
        headerName: 'Level 0',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const level1: ColumnGroup = {
        groupId: 'level1',
        headerName: 'Level 1',
        parentGroupId: 'level0',
        children: [],
        columnFields: [],
      };

      const level2: ColumnGroup = {
        groupId: 'level2',
        headerName: 'Level 2',
        parentGroupId: 'level1',
        children: [],
        columnFields: [],
      };

      modelWithMaxDepth.addGroup(level0);
      modelWithMaxDepth.addGroup(level1);

      expect(() => modelWithMaxDepth.addGroup(level2)).toThrow('Max depth exceeded');
    });

    it('should detect cycles in hierarchy', () => {
      const group1: ColumnGroup = {
        groupId: 'group1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const group2: ColumnGroup = {
        groupId: 'group2',
        headerName: 'Group 2',
        parentGroupId: 'group1',
        children: [],
        columnFields: [],
      };

      model.addGroup(group1);
      model.addGroup(group2);

      // Try to create cycle (group1 → group2 → group1)
      expect(() => {
        model.updateGroup('group1', { parentGroupId: 'group2' });
      }).toThrow('cycle');
    });

    it('should validate entire hierarchy', () => {
      const parent: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const child: ColumnGroup = {
        groupId: 'child',
        headerName: 'Child',
        parentGroupId: 'parent',
        children: [],
        columnFields: [],
      };

      model.addGroup(parent);
      model.addGroup(child);

      const result = model.validateHierarchy();
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Auto-Calculate Levels', () => {
    it('should auto-calculate levels for groups', () => {
      const root: ColumnGroup = {
        groupId: 'root',
        headerName: 'Root',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const level1: ColumnGroup = {
        groupId: 'level1',
        headerName: 'Level 1',
        parentGroupId: 'root',
        children: [],
        columnFields: [],
      };

      const level2: ColumnGroup = {
        groupId: 'level2',
        headerName: 'Level 2',
        parentGroupId: 'level1',
        children: [],
        columnFields: [],
      };

      model.addGroup(root);
      model.addGroup(level1);
      model.addGroup(level2);

      expect(model.getGroup('root')?.level).toBe(0);
      expect(model.getGroup('level1')?.level).toBe(1);
      expect(model.getGroup('level2')?.level).toBe(2);
    });

    it('should recalculate levels when parent changes', () => {
      const parent1: ColumnGroup = {
        groupId: 'parent1',
        headerName: 'Parent 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const parent2: ColumnGroup = {
        groupId: 'parent2',
        headerName: 'Parent 2',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const child: ColumnGroup = {
        groupId: 'child',
        headerName: 'Child',
        parentGroupId: 'parent1',
        children: [],
        columnFields: [],
      };

      const grandchild: ColumnGroup = {
        groupId: 'grandchild',
        headerName: 'Grandchild',
        parentGroupId: 'child',
        children: [],
        columnFields: [],
      };

      model.addGroup(parent1);
      model.addGroup(parent2);
      model.addGroup(child);
      model.addGroup(grandchild);

      expect(model.getGroup('child')?.level).toBe(1);
      expect(model.getGroup('grandchild')?.level).toBe(2);

      // Make parent2 a child of parent1
      model.updateGroup('parent2', { parentGroupId: 'parent1' });

      // Now move child to parent2
      model.updateGroup('child', { parentGroupId: 'parent2' });

      expect(model.getGroup('child')?.level).toBe(2);
      expect(model.getGroup('grandchild')?.level).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle getting non-existent group', () => {
      const group = model.getGroup('nonexistent');
      expect(group).toBeUndefined();
    });

    it('should handle removing non-existent group', () => {
      expect(() => model.removeGroup('nonexistent')).not.toThrow();
    });

    it('should handle updating non-existent group', () => {
      expect(() => model.updateGroup('nonexistent', { headerName: 'Updated' })).toThrow();
    });

    it('should handle getting children of non-existent group', () => {
      const children = model.getChildGroups('nonexistent');
      expect(children.length).toBe(0);
    });

    it('should handle expansion of non-existent group', () => {
      expect(() => model.expandGroup('nonexistent')).not.toThrow();
      expect(model.isExpanded('nonexistent')).toBe(true);
    });

    it('should return empty array for descendants of non-existent group', () => {
      const descendants = model.getDescendantGroups('nonexistent');
      expect(descendants.length).toBe(0);
    });

    it('should return empty array for ancestors of non-existent group', () => {
      const ancestors = model.getAncestorGroups('nonexistent');
      expect(ancestors.length).toBe(0);
    });
  });

  describe('Configuration Options', () => {
    it('should respect maxDepth configuration', () => {
      const modelWithMaxDepth = new ColumnGroupModel({ maxDepth: 3 });

      const level0: ColumnGroup = {
        groupId: 'level0',
        headerName: 'Level 0',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const level1: ColumnGroup = {
        groupId: 'level1',
        headerName: 'Level 1',
        parentGroupId: 'level0',
        children: [],
        columnFields: [],
      };

      const level2: ColumnGroup = {
        groupId: 'level2',
        headerName: 'Level 2',
        parentGroupId: 'level1',
        children: [],
        columnFields: [],
      };

      const level3: ColumnGroup = {
        groupId: 'level3',
        headerName: 'Level 3',
        parentGroupId: 'level2',
        children: [],
        columnFields: [],
      };

      modelWithMaxDepth.addGroup(level0);
      modelWithMaxDepth.addGroup(level1);
      modelWithMaxDepth.addGroup(level2);

      expect(() => modelWithMaxDepth.addGroup(level3)).toThrow('Max depth exceeded');
    });

    it('should allow disabling auto-calculate levels', () => {
      const modelNoAutoLevels = new ColumnGroupModel({ autoCalculateLevels: false });

      const root: ColumnGroup = {
        groupId: 'root',
        headerName: 'Root',
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      const child: ColumnGroup = {
        groupId: 'child',
        headerName: 'Child',
        parentGroupId: 'root',
        children: [],
        columnFields: [],
      };

      modelNoAutoLevels.addGroup(root);
      modelNoAutoLevels.addGroup(child);

      expect(model.getGroup('root')?.level).toBeUndefined();
      expect(model.getGroup('child')?.level).toBeUndefined();
    });

    it('should allow disabling validation', () => {
      const modelNoValidation = new ColumnGroupModel({ validateHierarchy: false });

      const group: ColumnGroup = {
        groupId: 'group1',
        headerName: '', // Invalid: empty headerName
        parentGroupId: null,
        children: [],
        columnFields: [],
      };

      // Should not throw even with invalid data
      expect(() => modelNoValidation.addGroup(group)).not.toThrow();
    });
  });
});
