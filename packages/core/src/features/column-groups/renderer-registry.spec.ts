import {
  RendererRegistry,
  globalRendererRegistry,
  registerRenderer,
  getRenderer,
  hasRenderer,
  createRendererRegistry,
} from './renderer-registry';
import { ColumnGroupRenderer, ColumnGroupRendererOptions } from './column-group-renderer';

describe('RendererRegistry', () => {
  let registry: RendererRegistry;

  beforeEach(() => {
    registry = new RendererRegistry();
  });

  describe('constructor', () => {
    it('should create a registry with default renderer', () => {
      expect(registry.has('default')).toBe(true);
      expect(registry.getDefaultRendererName()).toBe('default');
    });

    it('should accept custom default renderer name', () => {
      const customRegistry = new RendererRegistry('custom');
      expect(customRegistry.getDefaultRendererName()).toBe('custom');
    });
  });

  describe('register', () => {
    it('should register a renderer factory', () => {
      const factory = () => new ColumnGroupRenderer();
      registry.register('test', factory);

      expect(registry.has('test')).toBe(true);
    });

    it('should throw error for empty name', () => {
      const factory = () => new ColumnGroupRenderer();
      expect(() => registry.register('', factory)).toThrow('Renderer name cannot be empty');
    });

    it('should throw error for non-function factory', () => {
      expect(() => registry.register('test', null as any)).toThrow(
        'Renderer factory must be a function'
      );
    });

    it('should warn when overwriting existing renderer', () => {
      const factory = () => new ColumnGroupRenderer();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      registry.register('test', factory);
      registry.register('test', factory);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Renderer "test" is already registered. Overwriting.'
      );
      consoleSpy.mockRestore();
    });
  });

  describe('get', () => {
    it('should get a renderer instance by name', () => {
      const factory = () => new ColumnGroupRenderer({ expandedIcon: '▽' });
      registry.register('custom', factory);

      const renderer = registry.get('custom');
      expect(renderer).toBeInstanceOf(ColumnGroupRenderer);
    });

    it('should pass options to factory', () => {
      const factory = (options?: ColumnGroupRendererOptions) => {
        return new ColumnGroupRenderer(options);
      };
      registry.register('custom', factory);

      const renderer = registry.get('custom', { expandedIcon: '▽' });
      expect(renderer).toBeInstanceOf(ColumnGroupRenderer);
    });

    it('should return undefined for non-existent renderer', () => {
      const renderer = registry.get('non-existent');
      expect(renderer).toBeUndefined();
    });

    it('should return undefined if factory throws error', () => {
      const factory = () => {
        throw new Error('Factory error');
      };
      registry.register('error', factory);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const renderer = registry.get('error');

      expect(renderer).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('has', () => {
    it('should return true for registered renderer', () => {
      registry.register('test', () => new ColumnGroupRenderer());
      expect(registry.has('test')).toBe(true);
    });

    it('should return false for non-existent renderer', () => {
      expect(registry.has('non-existent')).toBe(false);
    });
  });

  describe('unregister', () => {
    it('should unregister a renderer', () => {
      registry.register('test', () => new ColumnGroupRenderer());
      expect(registry.has('test')).toBe(true);

      const result = registry.unregister('test');
      expect(result).toBe(true);
      expect(registry.has('test')).toBe(false);
    });

    it('should return false for non-existent renderer', () => {
      const result = registry.unregister('non-existent');
      expect(result).toBe(false);
    });

    it('should not unregister default renderer', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = registry.unregister('default');
      expect(result).toBe(false);
      expect(registry.has('default')).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getRegisteredNames', () => {
    it('should return all registered renderer names', () => {
      registry.register('test1', () => new ColumnGroupRenderer());
      registry.register('test2', () => new ColumnGroupRenderer());

      const names = registry.getRegisteredNames();
      expect(names).toContain('default');
      expect(names).toContain('test1');
      expect(names).toContain('test2');
      expect(names.length).toBe(3);
    });

    it('should return empty array for empty registry', () => {
      const emptyRegistry = new RendererRegistry();
      emptyRegistry.clear();
      const names = emptyRegistry.getRegisteredNames();
      expect(names).toEqual(['default']);
    });
  });

  describe('setDefaultRenderer', () => {
    it('should set default renderer', () => {
      registry.register('custom', () => new ColumnGroupRenderer());
      registry.setDefaultRenderer('custom');

      expect(registry.getDefaultRendererName()).toBe('custom');
    });

    it('should throw error for non-existent renderer', () => {
      expect(() => registry.setDefaultRenderer('non-existent')).toThrow(
        'Cannot set default renderer: "non-existent" is not registered'
      );
    });
  });

  describe('getDefaultRenderer', () => {
    it('should return default renderer instance', () => {
      const renderer = registry.getDefaultRenderer();
      expect(renderer).toBeInstanceOf(ColumnGroupRenderer);
    });

    it('should return custom default renderer', () => {
      registry.register('custom', () => new ColumnGroupRenderer({ expandedIcon: '▽' }));
      registry.setDefaultRenderer('custom');

      const renderer = registry.getDefaultRenderer();
      expect(renderer).toBeInstanceOf(ColumnGroupRenderer);
    });

    it('should pass options to default renderer', () => {
      const renderer = registry.getDefaultRenderer({ collapsedIcon: '▷' });
      expect(renderer).toBeInstanceOf(ColumnGroupRenderer);
    });
  });

  describe('clear', () => {
    it('should clear all renderers except default', () => {
      registry.register('test1', () => new ColumnGroupRenderer());
      registry.register('test2', () => new ColumnGroupRenderer());

      registry.clear();

      expect(registry.has('default')).toBe(true);
      expect(registry.has('test1')).toBe(false);
      expect(registry.has('test2')).toBe(false);
      expect(registry.getDefaultRendererName()).toBe('default');
    });
  });
});

describe('Global Registry Functions', () => {
  beforeEach(() => {
    globalRendererRegistry.clear();
  });

  describe('registerRenderer', () => {
    it('should register renderer in global registry', () => {
      registerRenderer('global-test', () => new ColumnGroupRenderer());
      expect(hasRenderer('global-test')).toBe(true);
    });
  });

  describe('getRenderer', () => {
    it('should get renderer from global registry', () => {
      registerRenderer('global-test', () => new ColumnGroupRenderer());
      const renderer = getRenderer('global-test');
      expect(renderer).toBeInstanceOf(ColumnGroupRenderer);
    });

    it('should return undefined for non-existent renderer', () => {
      const renderer = getRenderer('non-existent');
      expect(renderer).toBeUndefined();
    });

    it('should pass options to renderer', () => {
      registerRenderer('global-test', (opts) => new ColumnGroupRenderer(opts));
      const renderer = getRenderer('global-test', { expandedIcon: '▽' });
      expect(renderer).toBeInstanceOf(ColumnGroupRenderer);
    });
  });

  describe('hasRenderer', () => {
    it('should check if renderer exists in global registry', () => {
      expect(hasRenderer('default')).toBe(true);
      expect(hasRenderer('non-existent')).toBe(false);

      registerRenderer('global-test', () => new ColumnGroupRenderer());
      expect(hasRenderer('global-test')).toBe(true);
    });
  });
});

describe('createRendererRegistry', () => {
  it('should create a new isolated registry', () => {
    const registry1 = createRendererRegistry();
    const registry2 = createRendererRegistry();

    registry1.register('test', () => new ColumnGroupRenderer());

    expect(registry1.has('test')).toBe(true);
    expect(registry2.has('test')).toBe(false);
  });

  it('should accept custom default renderer name', () => {
    const registry = createRendererRegistry('custom');
    expect(registry.getDefaultRendererName()).toBe('custom');
  });
});

describe('Integration Tests', () => {
  it('should support multiple renderer types', () => {
    const registry = createRendererRegistry();

    registry.register('compact', (opts) =>
      new ColumnGroupRenderer({
        ...opts,
        showChildCount: false,
        expandedIcon: '−',
        collapsedIcon: '+',
      })
    );

    registry.register('detailed', (opts) =>
      new ColumnGroupRenderer({
        ...opts,
        showChildCount: true,
        expandedIcon: '▼',
        collapsedIcon: '▶',
      })
    );

    const compact = registry.get('compact');
    const detailed = registry.get('detailed');

    expect(compact).toBeInstanceOf(ColumnGroupRenderer);
    expect(detailed).toBeInstanceOf(ColumnGroupRenderer);
  });

  it('should allow changing default renderer at runtime', () => {
    const registry = createRendererRegistry();

    const defaultRenderer = registry.getDefaultRenderer();
    expect(defaultRenderer).toBeInstanceOf(ColumnGroupRenderer);

    registry.register('custom', () => new ColumnGroupRenderer({ expandedIcon: '▽' }));
    registry.setDefaultRenderer('custom');

    const newDefaultRenderer = registry.getDefaultRenderer();
    expect(newDefaultRenderer).toBeInstanceOf(ColumnGroupRenderer);
  });

  it('should handle renderer options correctly', () => {
    const registry = createRendererRegistry();

    registry.register('themed', (opts) =>
      new ColumnGroupRenderer({
        expandedIcon: opts?.expandedIcon || '▽',
        collapsedIcon: opts?.collapsedIcon || '▷',
        showChildCount: opts?.showChildCount ?? true,
      })
    );

    const renderer1 = registry.get('themed');
    const renderer2 = registry.get('themed', {
      expandedIcon: '⬇',
      collapsedIcon: '➡',
    });

    expect(renderer1).toBeInstanceOf(ColumnGroupRenderer);
    expect(renderer2).toBeInstanceOf(ColumnGroupRenderer);
  });
});
