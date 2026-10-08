# typed: false
# frozen_string_literal: true

class Kitshn < Formula
  desc "Small VPS deployment system for GitHub repos"
  homepage "https://github.com/Yarden-zamir/kitshn"
  url "https://github.com/Yarden-zamir/kitshn/archive/refs/tags/v0.7.0.tar.gz"
  sha256 "b112c875097c499861b708b2f52429cebb3ff6ff4ffcc7dbf56e3539bac221dd"
  license "MIT"
  head "https://github.com/Yarden-zamir/kitshn.git", branch: "main"

  depends_on "uv"

  def install
    libexec.install "pyproject.toml", "README.md", "src"
    (bin/"kitshn").write <<~SH
      #!/bin/bash
      export KITSHN_SOURCE_REF="v0.7.0"
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
