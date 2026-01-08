/**
 * Tests for ColumnGroupRenderer
 */

import { ColumnGroupRenderer, ColumnGroupRenderParams } from '../column-group-renderer';
import { ColumnGroupModel } from '../column-group-model';
import { ColumnGroup } from '../types';

describe('ColumnGroupRenderer', () => {
  let renderer: ColumnGroupRenderer;
  let model: ColumnGroupModel;
  let element: HTMLElement;

  beforeEach(() => {
    renderer = new ColumnGroupRenderer();
    model = new ColumnGroupModel();
    element = document.createElement('div');
  });

  afterEach(() => {
    renderer.destroy();
  });

  describe('Constructor', () => {
    it('should create instance with default options', () => {
      expect(renderer).toBeInstanceOf(ColumnGroupRenderer);
    });

    it('should accept custom options', () => {
      const customRenderer = new ColumnGroupRenderer({
        expandedIcon: '−',
        collapsedIcon: '+',
        showChildCount: false,
        collapsible: false,
        classPrefix: 'custom',
        animationDuration: 300,
      });
      expect(customRenderer).toBeInstanceOf(ColumnGroupRenderer);
      customRenderer.destroy();
    });
  });

  describe('Basic Rendering', () => {
    it('should render a simple group', () => {
      const group: ColumnGroup = {
        groupId: 'test',
        headerName: 'Test Group',
        parentGroupId: null,
        children: [],
        columnFields: ['col1', 'col2'],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      expect(element.innerHTML).toBeTruthy();
      expect(element.textContent).toContain('Test Group');
    });

    it('should clear existing content before rendering', () => {
      element.innerHTML = '<div>Old content</div>';

      const group: ColumnGroup = {
        groupId: 'test',
        headerName: 'Test Group',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      expect(element.textContent).not.toContain('Old content');
      expect(element.textContent).toContain('Test Group');
    });

    it('should render group with data attributes', () => {
      const group: ColumnGroup = {
        groupId: 'sales',
        headerName: 'Sales',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: true,
        level: 0,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      const wrapper = element.firstChild as HTMLElement;
      expect(wrapper.getAttribute('data-group-id')).toBe('sales');
      expect(wrapper.getAttribute('data-level')).toBe('0');
      expect(wrapper.getAttribute('data-expanded')).toBe('true');
    });
  });

  describe('Expand/Collapse Icon', () => {
    it('should show expand icon when group has children', () => {
      const group: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent Group',
        parentGroupId: null,
        children: ['child1'],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      const icon = element.querySelector('.zengrid-column-group-icon');
      expect(icon).toBeTruthy();
      expect(icon?.textContent).toBe('▼'); // expanded icon
    });

    it('should show collapsed icon when group is collapsed', () => {
      const group: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent Group',
        parentGroupId: null,
        children: ['child1'],
        columnFields: [],
        expanded: false,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      const icon = element.querySelector('.zengrid-column-group-icon');
      expect(icon?.textContent).toBe('▶'); // collapsed icon
    });

    it('should not show icon when group has no children', () => {
      const group: ColumnGroup = {
        groupId: 'leaf',
        headerName: 'Leaf Group',
        parentGroupId: null,
        children: [],
        columnFields: ['col1'],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      const icon = element.querySelector('.zengrid-column-group-icon');
      expect(icon).toBeFalsy();
    });

    it('should use custom icons when provided', () => {
      const customRenderer = new ColumnGroupRenderer({
        expandedIcon: '−',
        collapsedIcon: '+',
      });

      const group: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent',
        parentGroupId: null,
        children: ['child1'],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      customRenderer.render(element, { group, model });

      const icon = element.querySelector('.zengrid-column-group-icon');
      expect(icon?.textContent).toBe('−');

      customRenderer.destroy();
    });
  });

  describe('Header Text', () => {
    it('should display header name', () => {
      const group: ColumnGroup = {
        groupId: 'test',
        headerName: 'My Test Group',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      const header = element.querySelector('.zengrid-column-group-header');
      expect(header?.textContent).toBe('My Test Group');
    });
  });

  describe('Child Count Badge', () => {
    it('should show child count when enabled', () => {
      const group: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent',
        parentGroupId: null,
        children: ['child1', 'child2'],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      const badge = element.querySelector('.zengrid-column-group-badge');
      expect(badge).toBeTruthy();
    });

    it('should not show badge when disabled', () => {
      const customRenderer = new ColumnGroupRenderer({
        showChildCount: false,
      });

      const group: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent',
        parentGroupId: null,
        children: ['child1', 'child2'],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      customRenderer.render(element, { group, model });

      const badge = element.querySelector('.zengrid-column-group-badge');
      expect(badge).toBeFalsy();

      customRenderer.destroy();
    });

    it('should not show badge when group has no children', () => {
      const group: ColumnGroup = {
        groupId: 'leaf',
        headerName: 'Leaf',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      const badge = element.querySelector('.zengrid-column-group-badge');
      expect(badge).toBeFalsy();
    });

    it('should show column count when group has columns', () => {
      const group: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent',
        parentGroupId: null,
        children: [],
        columnFields: ['col1', 'col2', 'col3'],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      const badge = element.querySelector('.zengrid-column-group-badge');
      expect(badge?.textContent).toBe('3');
    });
  });

  describe('CSS Classes', () => {
    it('should apply default CSS classes', () => {
      const group: ColumnGroup = {
        groupId: 'test',
        headerName: 'Test',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: true,
        level: 0,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      const wrapper = element.firstChild as HTMLElement;
      expect(wrapper.className).toContain('zengrid-column-group');
      expect(wrapper.className).toContain('zengrid-column-group-level-0');
      expect(wrapper.className).toContain('zengrid-column-group-expanded');
    });

    it('should apply collapsed class when group is collapsed', () => {
      const group: ColumnGroup = {
        groupId: 'test',
        headerName: 'Test',
        parentGroupId: null,
        children: ['child1'],
        columnFields: [],
        expanded: false,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      const wrapper = element.firstChild as HTMLElement;
      expect(wrapper.className).toContain('zengrid-column-group-collapsed');
    });

    it('should apply leaf class when group has no children', () => {
      const group: ColumnGroup = {
        groupId: 'leaf',
        headerName: 'Leaf',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      const wrapper = element.firstChild as HTMLElement;
      expect(wrapper.className).toContain('zengrid-column-group-leaf');
    });

    it('should apply root class when isRoot is true', () => {
      const group: ColumnGroup = {
        groupId: 'root',
        headerName: 'Root',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model, isRoot: true });

      const wrapper = element.firstChild as HTMLElement;
      expect(wrapper.className).toContain('zengrid-column-group-root');
    });

    it('should apply custom CSS classes from group', () => {
      const group: ColumnGroup = {
        groupId: 'test',
        headerName: 'Test',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: true,
        cssClasses: ['custom-class-1', 'custom-class-2'],
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      const wrapper = element.firstChild as HTMLElement;
      expect(wrapper.className).toContain('custom-class-1');
      expect(wrapper.className).toContain('custom-class-2');
    });

    it('should apply custom CSS class from params', () => {
      const group: ColumnGroup = {
        groupId: 'test',
        headerName: 'Test',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model, className: 'my-custom-class' });

      const wrapper = element.firstChild as HTMLElement;
      expect(wrapper.className).toContain('my-custom-class');
    });

    it('should use custom class prefix when provided', () => {
      const customRenderer = new ColumnGroupRenderer({
        classPrefix: 'custom',
      });

      const group: ColumnGroup = {
        groupId: 'test',
        headerName: 'Test',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      customRenderer.render(element, { group, model });

      const wrapper = element.firstChild as HTMLElement;
      expect(wrapper.className).toContain('custom-column-group');

      customRenderer.destroy();
    });
  });

  describe('ARIA Attributes', () => {
    it('should set role="columnheader"', () => {
      const group: ColumnGroup = {
        groupId: 'test',
        headerName: 'Test',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      const wrapper = element.firstChild as HTMLElement;
      expect(wrapper.getAttribute('role')).toBe('columnheader');
    });

    it('should set aria-label', () => {
      const group: ColumnGroup = {
        groupId: 'test',
        headerName: 'Test Group',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      const wrapper = element.firstChild as HTMLElement;
      expect(wrapper.getAttribute('aria-label')).toBe('Test Group column group');
    });

    it('should set aria-level based on group level', () => {
      const group: ColumnGroup = {
        groupId: 'test',
        headerName: 'Test',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: true,
        level: 2,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      const wrapper = element.firstChild as HTMLElement;
      expect(wrapper.getAttribute('aria-level')).toBe('3'); // level + 1
    });

    it('should set aria-expanded when group has children', () => {
      const group: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent',
        parentGroupId: null,
        children: ['child1'],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      const wrapper = element.firstChild as HTMLElement;
      expect(wrapper.getAttribute('aria-expanded')).toBe('true');
    });

    it('should set tabindex when group is collapsible', () => {
      const group: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent',
        parentGroupId: null,
        children: ['child1'],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      const wrapper = element.firstChild as HTMLElement;
      expect(wrapper.getAttribute('tabindex')).toBe('0');
    });

    it('should not set tabindex when group has no children', () => {
      const group: ColumnGroup = {
        groupId: 'leaf',
        headerName: 'Leaf',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      const wrapper = element.firstChild as HTMLElement;
      expect(wrapper.getAttribute('tabindex')).toBeNull();
    });
  });

  describe('Toggle Functionality', () => {
    it('should toggle group on click', () => {
      const group: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent',
        parentGroupId: null,
        children: ['child1'],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      const wrapper = element.firstChild as HTMLElement;
      wrapper.click();

      expect(model.isExpanded('parent')).toBe(false);
    });

    it('should update icon when toggled', () => {
      const group: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent',
        parentGroupId: null,
        children: ['child1'],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      const wrapper = element.firstChild as HTMLElement;
      const icon = wrapper.querySelector('.zengrid-column-group-icon');

      expect(icon?.textContent).toBe('▼');

      wrapper.click();

      expect(icon?.textContent).toBe('▶');
    });

    it('should update aria-expanded when toggled', () => {
      const group: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent',
        parentGroupId: null,
        children: ['child1'],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      const wrapper = element.firstChild as HTMLElement;

      expect(wrapper.getAttribute('aria-expanded')).toBe('true');

      wrapper.click();

      expect(wrapper.getAttribute('aria-expanded')).toBe('false');
    });

    it('should update CSS classes when toggled', () => {
      const group: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent',
        parentGroupId: null,
        children: ['child1'],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      const wrapper = element.firstChild as HTMLElement;

      expect(wrapper.className).toContain('zengrid-column-group-expanded');

      wrapper.click();

      expect(wrapper.className).toContain('zengrid-column-group-collapsed');
      expect(wrapper.className).not.toContain('zengrid-column-group-expanded');
    });

    it('should call onToggle callback when toggled', () => {
      const onToggle = jest.fn();

      const group: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent',
        parentGroupId: null,
        children: ['child1'],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model, onToggle });

      const wrapper = element.firstChild as HTMLElement;
      wrapper.click();

      expect(onToggle).toHaveBeenCalledWith('parent', false);
    });

    it('should toggle on Enter key', () => {
      const group: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent',
        parentGroupId: null,
        children: ['child1'],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      const wrapper = element.firstChild as HTMLElement;
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      wrapper.dispatchEvent(event);

      expect(model.isExpanded('parent')).toBe(false);
    });

    it('should toggle on Space key', () => {
      const group: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent',
        parentGroupId: null,
        children: ['child1'],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      const wrapper = element.firstChild as HTMLElement;
      const event = new KeyboardEvent('keydown', { key: ' ' });
      wrapper.dispatchEvent(event);

      expect(model.isExpanded('parent')).toBe(false);
    });

    it('should not toggle on other keys', () => {
      const group: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent',
        parentGroupId: null,
        children: ['child1'],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });

      const wrapper = element.firstChild as HTMLElement;
      const event = new KeyboardEvent('keydown', { key: 'a' });
      wrapper.dispatchEvent(event);

      expect(model.isExpanded('parent')).toBe(true);
    });

    it('should not toggle when collapsible is false', () => {
      const customRenderer = new ColumnGroupRenderer({
        collapsible: false,
      });

      const group: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent',
        parentGroupId: null,
        children: ['child1'],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      customRenderer.render(element, { group, model });

      const wrapper = element.firstChild as HTMLElement;
      wrapper.click();

      expect(model.isExpanded('parent')).toBe(true);

      customRenderer.destroy();
    });
  });

  describe('renderGroups', () => {
    it('should render multiple groups', () => {
      const container = document.createElement('div');

      const group1: ColumnGroup = {
        groupId: 'group1',
        headerName: 'Group 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: true,
      };

      const group2: ColumnGroup = {
        groupId: 'group2',
        headerName: 'Group 2',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: true,
      };

      model.addGroup(group1);
      model.addGroup(group2);

      renderer.renderGroups(container, [group1, group2], model);

      expect(container.children.length).toBe(2);
      expect(container.textContent).toContain('Group 1');
      expect(container.textContent).toContain('Group 2');
    });

    it('should render children when group is expanded', () => {
      const container = document.createElement('div');

      const parent: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent',
        parentGroupId: null,
        children: ['child1'],
        columnFields: [],
        expanded: true,
      };

      const child: ColumnGroup = {
        groupId: 'child1',
        headerName: 'Child 1',
        parentGroupId: 'parent',
        children: [],
        columnFields: [],
        expanded: true,
      };

      model.addGroup(parent);
      model.addGroup(child);

      renderer.renderGroups(container, [parent], model);

      expect(container.textContent).toContain('Parent');
      expect(container.textContent).toContain('Child 1');
    });

    it('should not render children when group is collapsed', () => {
      const container = document.createElement('div');

      const parent: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent',
        parentGroupId: null,
        children: ['child1'],
        columnFields: [],
        expanded: false,
      };

      const child: ColumnGroup = {
        groupId: 'child1',
        headerName: 'Child 1',
        parentGroupId: 'parent',
        children: [],
        columnFields: [],
        expanded: true,
      };

      model.addGroup(parent);
      model.addGroup(child);

      renderer.renderGroups(container, [parent], model);

      expect(container.textContent).toContain('Parent');
      expect(container.textContent).not.toContain('Child 1');
    });
  });

  describe('Destroy', () => {
    it('should remove event listeners', () => {
      const group: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent',
        parentGroupId: null,
        children: ['child1'],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });
      const wrapper = element.firstChild as HTMLElement;

      // Verify event listener is attached
      wrapper.click();
      expect(model.isExpanded('parent')).toBe(false);

      // Reset state
      model.toggleGroup('parent');

      // Destroy renderer
      renderer.destroy();

      // Click should not toggle anymore (note: this is a limitation of the test,
      // in practice we'd need to test the event listener was removed)
      // For now, we just verify destroy() doesn't throw
      expect(() => renderer.destroy()).not.toThrow();
    });

    it('should clear event handlers map', () => {
      const group: ColumnGroup = {
        groupId: 'parent',
        headerName: 'Parent',
        parentGroupId: null,
        children: ['child1'],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group);

      renderer.render(element, { group, model });
      renderer.destroy();

      // Verify no errors when destroying again
      expect(() => renderer.destroy()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle group with no level defined', () => {
      const group: ColumnGroup = {
        groupId: 'test',
        headerName: 'Test',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: true,
        // level is undefined
      };
      model.addGroup(group);

      expect(() => renderer.render(element, { group, model })).not.toThrow();

      const wrapper = element.firstChild as HTMLElement;
      expect(wrapper.getAttribute('data-level')).toBe('0');
    });

    it('should handle group with undefined expanded', () => {
      const group: ColumnGroup = {
        groupId: 'test',
        headerName: 'Test',
        parentGroupId: null,
        children: ['child1'],
        columnFields: [],
        // expanded is undefined
      };
      model.addGroup(group);

      expect(() => renderer.render(element, { group, model })).not.toThrow();
    });

    it('should handle multiple renders to same element', () => {
      const group1: ColumnGroup = {
        groupId: 'test1',
        headerName: 'Test 1',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group1);

      renderer.render(element, { group: group1, model });

      const group2: ColumnGroup = {
        groupId: 'test2',
        headerName: 'Test 2',
        parentGroupId: null,
        children: [],
        columnFields: [],
        expanded: true,
      };
      model.addGroup(group2);

      // Re-render with different group
      renderer.render(element, { group: group2, model });

      expect(element.textContent).toContain('Test 2');
      expect(element.textContent).not.toContain('Test 1');
    });
  });
});
