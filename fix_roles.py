import os

filepath = 'src/app/layout/layout.component.ts'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace get visibleLinks()
old_visible_links = """  get visibleLinks(): NavLink[] {
    const role = this.user?.role;
    this.permissionState();

    if (!role) {
      return [];
    }

    return this.navLinks.filter((link) => {
      if (!link.roles.includes(role)) {
        return false;
      }

      return role === 'admin' || this.permissions.canAccess(role, link.route);
    });
  }"""

new_visible_links = """  get visibleLinks(): NavLink[] {
    const primaryRole = this.user?.role;
    const allRoles = this.user?.roles || (primaryRole ? [primaryRole] : []);
    this.permissionState();

    if (!primaryRole && allRoles.length === 0) {
      return [];
    }

    return this.navLinks.filter((link) => {
      return allRoles.some(role => {
        if (!link.roles.includes(role)) {
          return false;
        }
        return role === 'admin' || this.permissions.canAccess(role, link.route);
      });
    });
  }"""

# Replace get showSettingsLink()
old_settings = """  get showSettingsLink(): boolean {
    const role = this.user?.role;
    this.permissionState();
    return !!role && (role === 'admin' || this.permissions.canAccess(role, '/settings'));
  }"""

new_settings = """  get showSettingsLink(): boolean {
    const primaryRole = this.user?.role;
    const allRoles = this.user?.roles || (primaryRole ? [primaryRole] : []);
    this.permissionState();
    return allRoles.some(role => role === 'admin' || this.permissions.canAccess(role, '/settings'));
  }"""

content = content.replace(old_visible_links, new_visible_links)
content = content.replace(old_settings, new_settings)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Unified Role Merging Logic Activated!")
