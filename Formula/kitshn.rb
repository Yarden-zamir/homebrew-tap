# typed: false
# frozen_string_literal: true

class Kitshn < Formula
  desc "Small VPS deployment system for GitHub repos"
  homepage "https://github.com/Yarden-zamir/kitshn"
  url "https://github.com/Yarden-zamir/kitshn/archive/refs/tags/v0.2.0.tar.gz"
  sha256 "abd188ee5114fca94cd3ab65f2c9da6bec4be2956b3500e823e87bd0282dfbbd"
  license "MIT"
  head "https://github.com/Yarden-zamir/kitshn.git", branch: "main"

  depends_on "uv"

  def install
    libexec.install "pyproject.toml", "README.md", "src"
    (bin/"kitshn").write <<~SH
      #!/bin/bash
      export KITSHN_SOURCE_REF="v0.2.0"
      exec "#{formula_opt_bin("uv")}/uv" run --no-project --python 3.14 \
        --with 'kitshn @ file://#{libexec}' \
        kitshn "$@"
    SH
    chmod 0755, bin/"kitshn"
  end

  test do
    assert_match "Usage:", shell_output("#{bin}/kitshn --help")
  end
end
