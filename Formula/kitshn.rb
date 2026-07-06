# typed: false
# frozen_string_literal: true

class Kitshn < Formula
  desc "Small VPS deployment system for GitHub repos"
  homepage "https://github.com/Yarden-zamir/kitshn"
  url "https://github.com/Yarden-zamir/kitshn/archive/refs/tags/v0.1.4.tar.gz"
  sha256 "5296552a6153c37a9c6ac5bec1a66fab699033d28f993e1b4b8c8100fd749e48"
  license "MIT"
  head "https://github.com/Yarden-zamir/kitshn.git", branch: "main"

  depends_on "uv"

  def install
    libexec.install "pyproject.toml", "README.md", "src"
    (bin/"kitshn").write <<~SH
      #!/bin/bash
      export KITSHN_SOURCE_REF="v0.1.4"
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
