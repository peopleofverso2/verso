{ pkgs }: {
    deps = [
        pkgs.nodejs_20
        pkgs.nodePackages.typescript
        pkgs.nodePackages.yarn
        pkgs.nodePackages.pm2
    ];
}
