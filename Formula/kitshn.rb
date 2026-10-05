# typed: false
# frozen_string_literal: true

class Kitshn < Formula
  desc "Small VPS deployment system for GitHub repos"
  homepage "https://github.com/Yarden-zamir/kitshn"
  url "https://github.com/Yarden-zamir/kitshn/archive/refs/tags/v0.6.0.tar.gz"
  sha256 "4464337ff26c3cf4ce041072c3322f62685d84d573b8928df5eceb2c90d20433"
  license "MIT"
  head "https://github.com/Yarden-zamir/kitshn.git", branch: "main"

  depends_on "uv"

  def install
    libexec.install "pyproject.toml", "README.md", "src"
    (bin/"kitshn").write <<~SH
      #!/bin/bash
      export KITSHN_SOURCE_REF="v0.6.0"
      export KITSHN_SKILL_DIR="#{opt_libexec}/src/kitshn/resources/kitshn-deploy-service"
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
